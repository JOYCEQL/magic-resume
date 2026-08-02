import { createFileRoute } from "@tanstack/react-router";
import { getJob } from "@/lib/server/resume-agent/job-repository";

export const Route = createFileRoute("/api/resume-agent/jobs/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const job = await getJob(params.id);
        if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
        return Response.json({ job });
      },
    },
  },
});
