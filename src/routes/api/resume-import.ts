import { createFileRoute } from "@tanstack/react-router";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";
import {
  ResumeImportUpstreamError,
  getResumeImportSystemPrompt,
  normalizeResumeImportModelType,
  parseResumeJson,
  requestDeepSeekResumeImport,
} from "@/lib/server/resumeImport";

const extractBase64Payload = (value: string) => {
  const matched = value.match(/^data:(.*?);base64,(.*)$/);
  if (matched) {
    return {
      mimeType: matched[1] || "image/jpeg",
      data: matched[2] || "",
    };
  }

  return {
    mimeType: "image/jpeg",
    data: value,
  };
};

export const Route = createFileRoute("/api/resume-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { apiKey, model, content, images, locale, modelType: rawModelType } = body as {
            modelType?: unknown;
            apiKey: string;
            model?: string;
            content?: string;
            images?: string[];
            locale?: string;
          };
          const modelType = normalizeResumeImportModelType(rawModelType);

          if (!modelType) {
            return Response.json(
              { error: "Unsupported resume import model type" },
              { status: 400 },
            );
          }

          if (!apiKey || (!content && (!images || images.length === 0))) {
            return Response.json(
              { error: "Missing API key or resume content/images" },
              { status: 400 }
            );
          }

          if (modelType === "deepseek") {
            const resume = await requestDeepSeekResumeImport({
              apiKey,
              images: Array.isArray(images) ? images : [],
              locale,
              content,
            });

            return Response.json({ resume });
          }

          const geminiModel = model || "gemini-flash-latest";
          const imageParts = Array.isArray(images)
            ? images.map((image) => {
                const payload = extractBase64Payload(image);
                return {
                  inlineData: {
                    mimeType: payload.mimeType,
                    data: payload.data,
                  },
                };
              })
            : [];
          const modelInstance = getGeminiModelInstance({
            apiKey,
            model: geminiModel,
            systemInstruction: getResumeImportSystemPrompt(locale),
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          });

          const inputParts = [
            {
              text:
                content ||
                "请识别以下简历页面图片中的信息，并严格按 JSON 结构输出。",
            },
            ...imageParts,
          ];

          const result = await modelInstance.generateContent(inputParts);
          const aiContent = result.response.text();

          if (!aiContent || typeof aiContent !== "string") {
            return Response.json(
              { error: "AI did not return structured content" },
              { status: 500 }
            );
          }

          const parsedResume = parseResumeJson(aiContent);
          if (!parsedResume) {
            return Response.json(
              { error: "Failed to parse AI JSON output" },
              { status: 500 }
            );
          }

          return Response.json({ resume: parsedResume });
        } catch (error) {
          console.error("Error in resume import:", error);
          if (error instanceof ResumeImportUpstreamError) {
            return Response.json(
              {
                error: error.message,
                ...(error.code ? { code: error.code } : {}),
              },
              { status: error.status },
            );
          }
          const status =
            typeof (error as any)?.status === "number"
              ? (error as any).status
              : 500;
          return Response.json(
            { error: formatGeminiErrorMessage(error) },
            { status }
          );
        }
      },
    },
  },
});
