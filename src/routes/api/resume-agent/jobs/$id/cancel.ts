import { createFileRoute } from "@tanstack/react-router";
import { cancelResumeAgentJob } from "@/lib/server/resume-agent/runner";

export const Route = createFileRoute("/api/resume-agent/jobs/$id/cancel")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const job = await cancelResumeAgentJob(params.id);
        if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
        return Response.json({ job });
      },
    },
  },
});
