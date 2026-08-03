import { createFileRoute } from "@tanstack/react-router";
import { resumeResumeAgentJob } from "@/lib/server/resume-agent/runner";
import type { ResumeAgentInputMessage, ResumeAgentProviderPayload } from "@/types/resume-agent";

interface ResumeBody extends ResumeAgentProviderPayload {
  messages?: ResumeAgentInputMessage[];
}

export const Route = createFileRoute("/api/resume-agent/jobs/$id/resume")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const body = (await request.json()) as ResumeBody;
          if (!body.apiKey || !body.modelType || !body.model) {
            return Response.json({ error: "恢复任务需要当前 AI 服务商配置" }, { status: 400 });
          }
          const job = await resumeResumeAgentJob(params.id, body, body.messages);
          if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
          return Response.json({ jobId: job.id, status: "queued" }, { status: 202 });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
        }
      },
    },
  },
});
