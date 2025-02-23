import { NextRequest, NextResponse } from "next/server";
import { AIModelType } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType } = body;

    const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
    if (!modelConfig) {
      throw new Error("Invalid model type");
    }

    const response = await fetch(modelConfig.url, {
      method: "POST",
      headers: modelConfig.headers(apiKey),

      body: JSON.stringify({
        model: modelConfig.requiresModelId ? model : modelConfig.defaultModel,
        response_format: {
          type: "json_object"
        },
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in grammar check:", error);
    return NextResponse.json(
      { error: "Failed to check grammar" },
      { status: 500 }
    );
  }
}
