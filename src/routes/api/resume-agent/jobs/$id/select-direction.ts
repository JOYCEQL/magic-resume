import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS, type AIModelType } from "@/config/ai";
import { getJob } from "@/lib/server/resume-agent/job-repository";
import { selectResumeAgentDirection } from "@/lib/server/resume-agent/runner";
import type { ResumeAgentProviderPayload } from "@/types/resume-agent";

interface SelectDirectionBody extends Partial<ResumeAgentProviderPayload> {
  directionId?: string;
  company?: string;
  title?: string;
  url?: string;
  exposeReasoning?: boolean;
}

export const Route = createFileRoute("/api/resume-agent/jobs/$id/select-direction")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const body = (await request.json()) as SelectDirectionBody;
          const job = await getJob(params.id);
          if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
          // failed / cancelled 也放行：上一次选择可能因瞬时错误中断，用户要能重试
          if (!["waiting_user", "failed", "cancelled"].includes(job.status)) {
            return Response.json(
              { error: "只有等待选择或已停止的 Job 才能选择方向" },
              { status: 409 }
            );
          }
          const company = (body.company || "").trim();
          if (!company) {
            return Response.json({ error: "请选择一个具体公司" }, { status: 400 });
          }
          const modelType = body.modelType as AIModelType | undefined;
          const modelConfig = modelType ? AI_MODEL_CONFIGS[modelType] : undefined;
          // API Key 只经请求体传递，不进入 Job 持久化
          if (!modelType || !modelConfig || !body.apiKey) {
            return Response.json({ error: "AI 服务商配置不完整" }, { status: 400 });
          }
          if (modelConfig.requiresModelId && !body.model) {
            return Response.json({ error: "当前服务商需要指定模型 ID" }, { status: 400 });
          }
          const updated = await selectResumeAgentDirection(
            params.id,
            {
              modelType,
              apiKey: body.apiKey,
              model: body.model || "",
              apiEndpoint: body.apiEndpoint,
            },
            {
              directionId: (body.directionId || "").trim(),
              company,
              title: body.title,
              url: body.url,
            },
            { exposeReasoning: body.exposeReasoning }
          );
          if (!updated) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
          return Response.json(
            { jobId: updated.id, status: updated.status, runtime: updated.runtime },
            { status: 202 }
          );
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
