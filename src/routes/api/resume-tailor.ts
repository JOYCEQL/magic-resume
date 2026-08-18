import { createFileRoute } from "@tanstack/react-router";
import { isResumeStudioEnabled } from "@/config/resumeStudioGate";
import {
  createResumeStudioSession,
  resumeStudioRequestStatus,
} from "@/lib/server/resumeStudioSecurity";
import {
  fetchFinalizedResumeHandoff,
  parseFinalizedResumeRequest,
} from "@/lib/resumeStudioIntegration";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const rateLimitStatus = (request: Request) => {
  const origin = request.headers.get("origin") || "unknown";
  const now = Date.now();
  const bucket = requestCounts.get(origin);
  if (!bucket || bucket.resetAt <= now) {
    requestCounts.set(origin, { count: 1, resetAt: now + 60_000 });
  } else if (++bucket.count > 6) {
    return 429;
  }
  return 0;
};

const isServerEnabled = () =>
  isResumeStudioEnabled(
    process.env.NODE_ENV !== "production",
    process.env.RESUME_STUDIO_ENABLED,
  );

const errorResponse = (error: string, status: number) =>
  Response.json({ error }, { status });

export const Route = createFileRoute("/api/resume-tailor")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204 }),
      GET: ({ request }: { request: Request }) => {
        if (!isServerEnabled()) {
          return errorResponse("Resume Studio is unavailable", 404);
        }
        const session = createResumeStudioSession(
          request,
          process.env.RESUME_STUDIO_ACCESS_TOKEN,
        );
        if (session.status) {
          return errorResponse("Resume Studio session rejected", session.status);
        }
        return Response.json(
          { ready: true, mode: "renderer-only" },
          {
            headers: {
              "Cache-Control": "no-store",
              "Set-Cookie": session.cookie!,
            },
          },
        );
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          if (!isServerEnabled()) {
            return errorResponse("Resume Studio is unavailable", 404);
          }
          const guardStatus = resumeStudioRequestStatus(
            request,
            process.env.RESUME_STUDIO_ACCESS_TOKEN,
          ) || rateLimitStatus(request);
          if (guardStatus) {
            return errorResponse(
              guardStatus === 429
                ? "Too many requests"
                : guardStatus === 503
                  ? "Resume Studio access token is not configured"
                  : "Request rejected",
              guardStatus,
            );
          }
          const rawBody = await request.text();
          if (rawBody.length > 65_536) {
            return errorResponse("Request is too large", 413);
          }
          const { handoffToken } = parseFinalizedResumeRequest(JSON.parse(rawBody));
          const finalized = await fetchFinalizedResumeHandoff(
            "http://127.0.0.1:8765",
            handoffToken,
            fetch,
            process.env.JOB_SEEKER_INTEGRATION_TOKEN || "",
          );
          return Response.json(finalized);
        } catch (error) {
          console.error("Resume rendering handoff failed:", error);
          const code = error instanceof Error ? error.message : "";
          if (code === "RESUME_HANDOFF_400" || code === "RESUME_HANDOFF_404") {
            return errorResponse(
              "Resume handoff expired or was not found. Re-open the vacancy and create the CV again.",
              410,
            );
          }
          if (error instanceof SyntaxError ||
              (error instanceof Error && /handoff|renderer-only|vacancy launch/i.test(error.message))) {
            return errorResponse(
              error instanceof Error ? error.message : "Invalid renderer request",
              400,
            );
          }
          const timedOut = error instanceof Error && error.name === "TimeoutError";
          return errorResponse(
            timedOut ? "Job Seeker handoff timed out" : "Resume handoff failed",
            timedOut ? 504 : 502,
          );
        }
      },
    },
  },
});
