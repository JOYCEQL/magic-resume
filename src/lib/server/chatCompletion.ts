import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";
import {
  formatGeminiErrorMessage,
  getGeminiModelInstance,
} from "@/lib/server/gemini";

export interface ChatCompletionParams {
  modelType: AIModelType;
  apiKey: string;
  model: string;
  apiEndpoint?: string;
  systemPrompt: string;
  userContent: string;
  /** When true, request JSON-shaped output (provider-dependent). */
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

const parseUpstreamError = (raw: string, fallback: string) => {
  if (!raw) return { message: fallback };
  try {
    const data = JSON.parse(raw) as {
      error?: { message?: string; code?: string; type?: string };
      message?: string;
    };
    return {
      message: data.error?.message || data.message || fallback,
      code: data.error?.code || data.error?.type,
    };
  } catch {
    return { message: raw };
  }
};

const toOpenAIStyleResponse = (text: string) => ({
  choices: [
    {
      message: {
        content: text,
      },
    },
  ],
});

/**
 * Non-streaming completion used by grammar check (and similar JSON tasks).
 * Always returns an OpenAI-style `{ choices: [{ message: { content } }] }` payload.
 */
export async function createChatCompletion(
  params: ChatCompletionParams
): Promise<Response> {
  const {
    modelType,
    apiKey,
    model,
    apiEndpoint,
    systemPrompt,
    userContent,
    jsonMode = false,
    temperature,
    maxTokens = 4096,
  } = params;

  const modelConfig = AI_MODEL_CONFIGS[modelType];
  if (!modelConfig) {
    return Response.json({ error: "Invalid model type" }, { status: 400 });
  }

  const resolvedModel = modelConfig.requiresModelId
    ? model
    : model || modelConfig.defaultModel || "";

  try {
    if (modelConfig.apiFormat === "gemini") {
      const geminiModel = resolvedModel || "gemini-flash-latest";
      const modelInstance = getGeminiModelInstance({
        apiKey,
        model: geminiModel,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: temperature ?? 0,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      });

      const result = await modelInstance.generateContent(userContent);
      const text = result.response.text() || "";
      return Response.json(toOpenAIStyleResponse(text));
    }

    if (modelConfig.apiFormat === "anthropic") {
      const response = await fetch(modelConfig.url(apiEndpoint), {
        method: "POST",
        headers: modelConfig.headers(apiKey),
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: maxTokens,
          temperature: temperature ?? 0,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      const raw = await response.text();
      if (!response.ok) {
        const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
        const parsedError = parseUpstreamError(raw, fallbackMessage);
        return Response.json({ error: parsedError }, { status: response.status });
      }

      let data: {
        content?: Array<{ type?: string; text?: string }>;
        error?: { message?: string };
      };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        return Response.json(
          { error: "Invalid upstream response: expected JSON payload" },
          { status: 502 }
        );
      }

      const text =
        data.content
          ?.filter((block) => block.type === "text" && block.text)
          .map((block) => block.text)
          .join("") || "";

      return Response.json(toOpenAIStyleResponse(text));
    }

    // openai_chat (doubao / deepseek / openai / grok / OpenAI-compatible gateways)
    const response = await fetch(modelConfig.url(apiEndpoint), {
      method: "POST",
      headers: modelConfig.headers(apiKey),
      body: JSON.stringify({
        model: resolvedModel,
        ...(typeof temperature === "number" ? { temperature } : {}),
        ...(jsonMode
          ? {
              response_format: {
                type: "json_object",
              },
            }
          : {}),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
      const parsedError = parseUpstreamError(raw, fallbackMessage);
      return Response.json({ error: parsedError }, { status: response.status });
    }

    try {
      const data = raw ? JSON.parse(raw) : {};
      return Response.json(data);
    } catch {
      return Response.json(
        { error: "Invalid upstream response: expected JSON payload" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Chat completion error:", error);
    return Response.json(
      { error: formatGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Streaming completion used by polish. Returns a plain text SSE body
 * (decoded delta content only) so the frontend can append chunks directly.
 */
export async function createChatCompletionStream(
  params: ChatCompletionParams
): Promise<Response> {
  const {
    modelType,
    apiKey,
    model,
    apiEndpoint,
    systemPrompt,
    userContent,
    temperature = 0.4,
    maxTokens = 4096,
  } = params;

  const modelConfig = AI_MODEL_CONFIGS[modelType];
  if (!modelConfig) {
    return Response.json({ error: "Invalid model type" }, { status: 400 });
  }

  const resolvedModel = modelConfig.requiresModelId
    ? model
    : model || modelConfig.defaultModel || "";

  const streamHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  try {
    if (modelConfig.apiFormat === "gemini") {
      const geminiModel = resolvedModel || "gemini-flash-latest";
      const modelInstance = getGeminiModelInstance({
        apiKey,
        model: geminiModel,
        systemInstruction: systemPrompt,
        generationConfig: { temperature },
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const result = await modelInstance.generateContentStream(userContent);
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                controller.enqueue(encoder.encode(chunkText));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, { headers: streamHeaders });
    }

    if (modelConfig.apiFormat === "anthropic") {
      const response = await fetch(modelConfig.url(apiEndpoint), {
        method: "POST",
        headers: modelConfig.headers(apiKey),
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          stream: true,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      if (!response.ok) {
        const rawError = await response.text();
        const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
        const parsedError = parseUpstreamError(rawError, fallbackMessage);
        return Response.json({ error: parsedError }, { status: response.status });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          if (!response.body) {
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              pending += decoder.decode(value, { stream: true });
              const lines = pending.split(/\r?\n/);
              pending = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;

                const payload = trimmed.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;

                try {
                  const data = JSON.parse(payload) as {
                    type?: string;
                    error?: { message?: string };
                    delta?: { type?: string; text?: string };
                  };

                  if (data.error?.message) {
                    controller.error(new Error(data.error.message));
                    return;
                  }

                  if (
                    data.type === "content_block_delta" &&
                    data.delta?.type === "text_delta" &&
                    data.delta.text
                  ) {
                    controller.enqueue(encoder.encode(data.delta.text));
                  }
                } catch (e) {
                  console.error("Error parsing Anthropic stream JSON:", e);
                }
              }
            }

            controller.close();
          } catch (error) {
            console.error("Anthropic stream reading error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, { headers: streamHeaders });
    }

    // openai_chat streaming
    const response = await fetch(modelConfig.url(apiEndpoint), {
      method: "POST",
      headers: modelConfig.headers(apiKey),
      body: JSON.stringify({
        model: resolvedModel,
        temperature,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
      const parsedError = parseUpstreamError(rawError, fallbackMessage);
      return Response.json({ error: parsedError }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            pending += decoder.decode(value, { stream: true });
            const lines = pending.split(/\r?\n/);
            pending = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              try {
                const payload = trimmed.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;

                const data = JSON.parse(payload) as {
                  error?: { message?: string };
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                if (data.error?.message) {
                  controller.error(new Error(data.error.message));
                  return;
                }

                const deltaContent = data.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  controller.enqueue(encoder.encode(deltaContent));
                }
              } catch (e) {
                console.error("Error parsing OpenAI stream JSON:", e);
              }
            }
          }

          const tail = (pending + decoder.decode()).trim();
          if (tail.startsWith("data:")) {
            const payload = tail.slice(5).trim();
            if (payload && payload !== "[DONE]") {
              try {
                const data = JSON.parse(payload) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const deltaContent = data.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  controller.enqueue(encoder.encode(deltaContent));
                }
              } catch {
                // ignore incomplete tail
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, { headers: streamHeaders });
  } catch (error) {
    console.error("Chat stream error:", error);
    return Response.json(
      { error: formatGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
