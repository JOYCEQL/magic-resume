import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model, content } = body;

    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `你是一个专业的中文简历语法检查助手。请完整检查以下文本中的语法语境错别字，包括：
                1. 只考虑语法环境中的错别字
                2. 标点符号使用错误

                对每个发现的问题，请以JSON格式返回，格式如下：
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

                请确保返回的是可解析的JSON格式。`,
            },
            {
              role: "user",
              content: content,
            },
          ],
        }),
      }
    );

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
