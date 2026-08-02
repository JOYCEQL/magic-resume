import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS, type AIModelType } from "@/config/ai";
import { createAndRunResumeAgentJob } from "@/lib/server/resume-agent/runner";
import type { CreateResumeAgentJobRequest } from "@/types/resume-agent";

const validateRequest = (body: CreateResumeAgentJobRequest) => {
  const modelType = body.modelType as AIModelType;
  const modelConfig = AI_MODEL_CONFIGS[modelType];
  return Boolean(
    modelConfig &&
      body.apiKey &&
      Array.isArray(body.messages) &&
      body.messages.length > 0 &&
      (!modelConfig.requiresModelId || body.model) &&
      (modelType !== "openai" || body.apiEndpoint)
  );
};

export const Route = createFileRoute("/api/resume-agent/jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as CreateResumeAgentJobRequest;
          if (!validateRequest(body)) {
            return Response.json({ error: "AI 服务商配置或对话内容不完整" }, { status: 400 });
          }
          const job = await createAndRunResumeAgentJob(body);
          return Response.json({
            jobId: job.id,
            sessionId: job.sessionId,
            status: job.status,
            runtime: job.runtime,
          }, { status: 202 });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
        }
      },
    },
  },
});
