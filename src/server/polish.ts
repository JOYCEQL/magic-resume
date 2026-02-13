import { createServerFn } from "@tanstack/react-start";

interface PolishRequest {
  content: string;
  modelType: string;
  apiKey: string;
  modelId?: string;
  apiEndpoint?: string;
}

export const polishContent = createServerFn({
  method: "POST",
}).handler(async (ctx) => {
  const data = (ctx as any).data as PolishRequest;
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

  const systemPrompt = `你是一个专业的简历润色助手。请优化以下简历内容，使其更加专业、简洁、有力。
要求：
1. 保持原意不变
2. 使用更专业的措辞
3. 突出成果和数据
4. 使用动词开头
5. 只返回润色后的文本，不要其他说明`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  // Return streaming response as a ReadableStream
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const lineData = line.slice(6);
              if (lineData === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(lineData);
                const contentChunk =
                  parsed.choices?.[0]?.delta?.content || "";
                if (contentChunk) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ content: contentChunk })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
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
});
