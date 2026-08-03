import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS, type AIModelType } from "@/config/ai";
import { formatAnswersAsMessage } from "@/lib/server/resume-agent/clarification";
import { getJob } from "@/lib/server/resume-agent/job-repository";
import { answerResumeAgentQuestions } from "@/lib/server/resume-agent/runner";
import type {
  ResumeAgentProviderPayload,
  ResumeAgentQuestionAnswer,
} from "@/types/resume-agent";

interface AnswerBody extends Partial<ResumeAgentProviderPayload> {
  answers?: ResumeAgentQuestionAnswer[];
  exposeReasoning?: boolean;
}

const isAnswer = (value: unknown): value is ResumeAgentQuestionAnswer => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ResumeAgentQuestionAnswer;
  return (
    typeof candidate.questionId === "string" &&
    candidate.questionId.length > 0 &&
    Array.isArray(candidate.selectedOptionIds) &&
    candidate.selectedOptionIds.every((id) => typeof id === "string")
  );
};

export const Route = createFileRoute("/api/resume-agent/jobs/$id/answer")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const body = (await request.json()) as AnswerBody;
          const job = await getJob(params.id);
          if (!job) return Response.json({ error: "Resume Agent Job 不存在" }, { status: 404 });
          // failed / cancelled 也放行：上一次作答可能因瞬时网络错误中断，此时
          // pendingQuestions 已清空但答案未生效，用户必须能用同一批答案重试。
          if (!["waiting_user", "failed", "cancelled"].includes(job.status)) {
            return Response.json(
              { error: "只有等待补充或已停止的 Job 才能提交回答" },
              { status: 409 }
            );
          }
          const answers = (body.answers || []).filter(isAnswer);
          if (!answers.length) {
            return Response.json({ error: "没有可提交的回答" }, { status: 400 });
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
          const language = job.input.locale.toLowerCase().startsWith("en") ? "en" : "zh";
          const answerMessage = formatAnswersAsMessage(
            job.checkpoint.pendingQuestions || [],
            answers,
            language
          );
          if (!answerMessage) {
            return Response.json({ error: "回答内容为空" }, { status: 400 });
          }
          const updated = await answerResumeAgentQuestions(
            params.id,
            {
              modelType,
              apiKey: body.apiKey,
              model: body.model || "",
              apiEndpoint: body.apiEndpoint,
            },
            answerMessage,
            answers,
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
