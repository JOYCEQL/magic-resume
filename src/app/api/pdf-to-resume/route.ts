import { NextRequest, NextResponse } from "next/server";
import { AIModelType } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { initialResumeTemplate } from "@/config/initialResumeData";

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
          type: "json_object",
        },
        stream: false,
        messages: [
          {
            role: "system",
            content: `你是一个专业的简历解析助手。请将提供的PDF文本内容解析为结构化的简历数据。
            
            请按照以下JSON格式返回解析结果，参考示例格式：
            ${JSON.stringify(initialResumeTemplate, null, 2)}
            
            解析规则：
            1. 分析文本中的个人信息、教育背景、工作经验、项目经验和技能等内容
            2. 将内容按照上述JSON格式进行结构化
            3. 如果某些字段在文本中找不到对应信息，请保留默认值
            4. 确保返回的JSON格式正确，可以被正常解析
            5. 保持原有的数据结构不变，只替换相应的值
            6. 对于数组类型的字段（如education、experience、projects等），根据文本内容生成适当数量的条目
            7. 如果文本中包含英文内容，请正确处理中英文混合的情况
            8. 根据文本内容以及分段格式，正确换行显示，需要注意遇到分号意味着换行，段落需要层次分明
            9. 根据类型将长文本无序列表，有序列表的内容都合并到描述字段中
            10. 确保所有文本没有遗漏，不要忽略任何文字
            11. 请确保返回的是完整的JSON对象，可以直接用于创建新简历。`,
          },
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to parse PDF content: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PDF to resume conversion:", error);
    return NextResponse.json(
      { error: "Failed to convert PDF to resume" },
      { status: 500 }
    );
  }
}
