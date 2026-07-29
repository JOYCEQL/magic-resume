import { createFileRoute } from "@tanstack/react-router";
import { AIModelType, AI_MODEL_CONFIGS } from "@/config/ai";
import { createChatCompletionStream } from "@/lib/server/chatCompletion";
import { formatGeminiErrorMessage } from "@/lib/server/gemini";

export const Route = createFileRoute("/api/polish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const {
            apiKey,
            model,
            content,
            modelType,
            apiEndpoint,
            customInstructions,
          } = body as {
            apiKey: string;
            model: string;
            content: string;
            modelType: AIModelType;
            apiEndpoint?: string;
            customInstructions?: string;
          };

          const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
          if (!modelConfig) {
            throw new Error("Invalid model type");
          }

          let systemPrompt = `你是一个专业的简历优化助手。请帮助优化以下 Markdown 格式的文本，使其更加专业和有吸引力。

              优化原则：
              1. 使用更专业的词汇和表达方式
              2. 突出关键成就和技能
              3. 保持简洁清晰
              4. 使用主动语气
              5. 保持原有信息的完整性
              6. 严格保留原有的 Markdown 格式结构（列表项保持为列表项，加粗保持加粗等）
              
              输出强约束（必须遵守）：
              1. 只能输出“润色后的正文内容”本身。
              2. 禁止输出任何前言、说明、总结、附加建议。
              3. 禁止出现这类引导语：如“以下是...”“根据您提供...”“这是...”“特点：”“说明：”“总结：”等。
              4. 禁止新增与原文无关的章节标题或收尾段落。
              5. 不要使用 Markdown 代码块（\`\`\`）包裹结果。
              6. 若你产生了解释性内容，必须在输出前自检并删除，只保留最终正文。`;

          if (customInstructions?.trim()) {
            systemPrompt += `\n\n用户额外要求：\n${customInstructions.trim()}`;
          }

          return createChatCompletionStream({
            modelType,
            apiKey,
            model,
            apiEndpoint,
            systemPrompt,
            userContent: content,
            temperature: 0.4,
          });
        } catch (error) {
          console.error("Polish error:", error);
          return Response.json(
            { error: formatGeminiErrorMessage(error) },
            { status: 500 }
          );
        }
      },
    },
  },
});
