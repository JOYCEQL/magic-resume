import { NextResponse } from "next/server";
import { AIModelType } from "@/config/ai";
import { AI_MODEL_CONFIGS } from "@/config/ai";

type ContentLanguage = "zh" | "en" | "mixed";

const detectContentLanguage = (content: string): ContentLanguage => {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishChars = (content.match(/[A-Za-z]/g) || []).length;

  if (chineseChars === 0 && englishChars === 0) {
    return "mixed";
  }
  if (chineseChars > englishChars * 1.2) {
    return "zh";
  }
  if (englishChars > chineseChars * 1.2) {
    return "en";
  }
  return "mixed";
};

const getLanguageInstruction = (language: ContentLanguage) => {
  if (language === "zh") {
    return "7. 输出必须保持为中文，严禁翻译成英文或其他语言。";
  }
  if (language === "en") {
    return "7. Output must remain in English. Do not translate into Chinese or any other language.";
  }
  return "7. 保持原文语种：中文内容继续用中文，英文内容继续用英文；禁止跨语种翻译。";
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType, apiEndpoint } = body;

    const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
    if (!modelConfig) {
      throw new Error("Invalid model type");
    }

    const language = detectContentLanguage(content || "");
    const languageInstruction = getLanguageInstruction(language);

    const response = await fetch(modelConfig.url(apiEndpoint), {
      method: "POST",
      headers: modelConfig.headers(apiKey),
      body: JSON.stringify({
        model: modelConfig.requiresModelId ? model : modelConfig.defaultModel,
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
              ${languageInstruction}
              
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
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
              .filter((line) => line.trim() !== "");

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
                console.error("Error parsing JSON:", e);
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Polish error:", error);
    return NextResponse.json(
      { error: "Failed to polish content" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
