import { NextRequest, NextResponse } from "next/server";
import { AIModelType } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType, baseURL } = body;

    // 参数校验
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
      finalModel = model; // 直接使用用户输入的模型ID
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

    // 统一请求配置
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // 统一使用 Bearer Token
      },
      body: JSON.stringify({
        model: finalModel,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你是一个专业的中文简历错别字检查助手。请完整检查以下文本，不要遗漏，以下是要求：
              1.所有考虑中文语境下的语法组词错误，包括拼写错误，语境用词错误，专业术语错误。
              2.验证是否有遗漏文字未检查
              3.对每个发现的问题，请按JSON格式返回

              以下是示例格式：
              {
                "errors": [
                  {
                    "text": "错误的文本",
                    "message": "详细的错误说明",
                    "type": "spelling"或"grammar",
                    "suggestions": ["建议修改1", "建议修改2"]
                  }
                ]
              }

              请确保返回的格式可以正常解析`
          },
          {
            role: "user",
            content: content
          }
        ]
      })
    });

    // 处理错误响应
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API 请求失败:", {
        status: response.status,
        error: errorData,
        requestUrl,
        modelType
      });
      return NextResponse.json(
        { 
          error: "服务商请求失败",
          details: errorData 
        },
        { status: 502 } // 标记为网关错误
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("语法检查失败:", {
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: "内部服务器错误" },
      { status: 500 }
    );
  }
}
