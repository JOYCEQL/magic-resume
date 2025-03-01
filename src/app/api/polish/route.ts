import { NextResponse } from "next/server";
import { AIModelType } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType, baseURL } = body;

    // 参数验证
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key 不能为空" },
        { status: 400 }
      );
    }

    if (modelType === "custom" && !baseURL) {
      return NextResponse.json(
        { error: "自定义服务商需要提供 Base URL" },
        { status: 400 }
      );
    }

    // 动态配置请求参数
    let requestUrl: string;
    let finalModel: string;

    if (modelType === "custom") {
      requestUrl = baseURL;
      finalModel = model;
    } else {
      const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
      if (!modelConfig) {
        return NextResponse.json(
          { error: "不支持的模型类型" },
          { status: 400 }
        );
      }
      requestUrl = modelConfig.url;
      finalModel = modelConfig.requiresModelId 
        ? model 
        : modelConfig.defaultModel!;
    }

    // 发起流式请求
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages: [
          {
            role: "system",
            content: `你是一个专业的简历优化助手。请帮助优化以下文本，使其更加专业和有吸引力。
              
              优化原则：
              1. 使用更专业的词汇和表达方式
              2. 突出关键成就和技能
              3. 保持简洁清晰
              4. 使用主动语气
              5. 保持原有信息的完整性
              6. 保留我输入的格式
              
              请直接返回优化后的文本，不要包含任何解释或其他内容。`,
          },
          {
            role: "user",
            content,
          },
        ],
        stream: true,
      }),
    });

    // 处理流式响应
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          if (!response.body) {
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk
                .split("\n")
                .filter(line => line.trim() !== "");

              for (const line of lines) {
                if (line.includes("[DONE]")) continue;
                if (!line.startsWith("data:")) continue;

                try {
                  const data = JSON.parse(line.slice(5));
                  const content = data.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  console.error("JSON 解析错误:", {
                    line,
                    error: e instanceof Error ? e.message : String(e)
                  });
                }
              }
            }
          } catch (error) {
            console.error("流式读取错误:", error);
            controller.error(error);
          }
        },
        cancel() {
          reader.cancel();
        }
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("简历优化失败:", {
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "内部服务器错误" },
      { status: 500 }
    );
  }
}
