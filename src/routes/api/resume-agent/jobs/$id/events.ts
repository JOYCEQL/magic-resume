import { createFileRoute } from "@tanstack/react-router";
import { getJob, listJobEvents } from "@/lib/server/resume-agent/job-repository";

export const Route = createFileRoute("/api/resume-agent/jobs/$id/events")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const job = await getJob(params.id);
        if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
        const url = new URL(request.url);
        const after = Math.max(0, Number(url.searchParams.get("after") || 0) || 0);
        const events = await listJobEvents(params.id, after);
        return Response.json({ events, status: job.status, phase: job.phase });
      },
    },
  },
});
