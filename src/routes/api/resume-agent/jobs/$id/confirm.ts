import { createFileRoute } from "@tanstack/react-router";
import { appendJobEvent, getJob, saveJob } from "@/lib/server/resume-agent/job-repository";
import type { ResumeAgentUserDecision } from "@/types/resume-agent";
import { validateResumeDraft } from "@/utils/resumeAgent";

interface ConfirmBody {
  type?: ResumeAgentUserDecision["type"];
  value?: unknown;
}

export const Route = createFileRoute("/api/resume-agent/jobs/$id/confirm")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = (await request.json()) as ConfirmBody;
        const job = await getJob(params.id);
        if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
        const decision: ResumeAgentUserDecision = {
          id: crypto.randomUUID(),
          type: body.type || "confirm_draft",
          value: body.value ?? true,
          createdAt: new Date().toISOString(),
        };
        const confirmedDraft =
          decision.type === "confirm_draft" &&
          (decision.value === true ||
            (typeof decision.value === "object" &&
              decision.value !== null &&
              (decision.value as { confirmed?: unknown }).confirmed === true));
        if (confirmedDraft) {
          if (!job.checkpoint.draft) {
            return Response.json(
              { error: "该 Job 还没有生成简历草稿，无法确认入库" },
              { status: 409 }
            );
          }
          // completed 幂等：用户重复点保存不该报错。
          // cancelled / failed 也放行：草稿已生成且下面的 canSave 才是真正门禁，
          // 用户中途停止后服务端仍留着一份完整草稿，没有理由拒绝入库。
          if (!["waiting_user", "completed", "cancelled", "failed"].includes(job.status)) {
            return Response.json(
              { error: "当前 Job 正在执行，请等待本轮结束后再确认" },
              { status: 409 }
            );
          }
          const validation = validateResumeDraft(job.checkpoint.draft);
          if (!validation.canSave) {
            return Response.json({
              error: "草稿仍有必须补充或冲突事实，不能确认入库",
              issues: validation.issues,
            }, { status: 409 });
          }
          job.decisions.push(decision);
          job.status = "completed";
          job.phase = "completed";
          job.checkpoint.phase = "completed";
          job.checkpoint.pendingQuestion = undefined;
          job.completedAt = new Date().toISOString();
          job.error = undefined;
          job.assistantMessage = "事实已由你确认，可以选择 Magic Resume 模板并保存到“我的简历”。";
        } else {
          job.decisions.push(decision);
        }
        job.updatedAt = new Date().toISOString();
        job.checkpoint.updatedAt = job.updatedAt;
        await saveJob(job);
        if (job.status === "completed") {
          await appendJobEvent(job.id, "job.completed", {
            assistantMessage: job.assistantMessage,
            draft: job.checkpoint.draft,
            runtime: "native",
            confirmedByUser: true,
          });
        } else {
          await appendJobEvent(job.id, "checkpoint.saved", { decision });
        }
        return Response.json({ job });
      },
    },
  },
});
