import { createFileRoute } from "@tanstack/react-router";
import { continueResumeAgentJob } from "@/lib/server/resume-agent/runner";
import type { ResumeAgentInputMessage, ResumeAgentProviderPayload } from "@/types/resume-agent";

interface ContinueBody extends ResumeAgentProviderPayload {
  messages?: ResumeAgentInputMessage[];
  exposeReasoning?: boolean;
}

export const Route = createFileRoute("/api/resume-agent/jobs/$id/continue")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const body = (await request.json()) as ContinueBody;
          if (!body.apiKey || !body.modelType || !body.model) {
            return Response.json({ error: "继续对话需要当前 AI 服务商配置" }, { status: 400 });
          }
          const job = await continueResumeAgentJob(
            params.id,
            {
              modelType: body.modelType,
              apiKey: body.apiKey,
              model: body.model,
              apiEndpoint: body.apiEndpoint,
            },
            body.messages,
            { exposeReasoning: body.exposeReasoning }
          );
          if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
          return Response.json({ jobId: job.id, status: "queued" }, { status: 202 });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }
      },
    },
  },
});
