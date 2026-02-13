import { createServerFn } from "@tanstack/react-start";

interface GrammarCheckRequest {
  content: string;
  modelType: string;
  apiKey: string;
  modelId?: string;
  apiEndpoint?: string;
}

export const checkGrammar = createServerFn({
  method: "POST",
}).handler(async (ctx) => {
  const data = (ctx as any).data as GrammarCheckRequest;
  const { content, modelType, apiKey, modelId, apiEndpoint } = data;

  if (!content || !modelType || !apiKey) {
    throw new Error("Missing required fields: content, modelType, apiKey");
  }

  let url: string;
  let model: string;
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (modelType === "deepseek") {
    url = "https://api.deepseek.com/v1/chat/completions";
    model = "deepseek-chat";
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (modelType === "doubao") {
    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
    model = modelId || "";
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (modelType === "openai") {
    url = `${apiEndpoint || "https://api.openai.com"}/v1/chat/completions`;
    model = modelId || "gpt-3.5-turbo";
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    throw new Error("Invalid model type");
  }

  const systemPrompt = `你是一个专业的文字校对助手。请检查以下文本中的语法错误、拼写错误和表达不当之处。
对于每个问题，以JSON数组格式返回结果，每个元素包含以下字段：
- original: 原始有问题的文本
- suggestion: 建议修改后的文本  
- reason: 修改理由
只返回JSON数组，不要添加其他说明文字。如果没有问题，返回空数组 []。`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const assistantMessage = result.choices?.[0]?.message?.content || "[]";

  try {
    const parsed = JSON.parse(assistantMessage);
    return parsed;
  } catch {
    return [];
  }
});
