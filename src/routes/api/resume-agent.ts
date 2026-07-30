import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS, type AIModelType } from "@/config/ai";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";
import type { ResumeAgentRequest } from "@/types/resume-agent";
import { normalizeResumeDraft } from "@/utils/resumeAgent";

const SYSTEM_PROMPT = `You are the Resume Agent inside Magic Resume. Follow these rules strictly:
1. Build and continuously update a factual, ATS-friendly resume draft from the conversation.
2. Never invent identity, education, employment, projects, skills, certifications, dates, metrics, or achievements.
3. If a requested job skill is not supported by user evidence, put it in targetJob.missingSkills. Never present it as an acquired skill.
4. Preserve useful facts from currentDraft unless the user explicitly corrects them.
5. Ask only the most important follow-up questions. Prefer progressive disclosure instead of a long questionnaire.
6. Detect contradictions and put them in conflicts. Put uncertain transformations in assumptions and low-confidence evidence.
7. Rewrite supplied facts into concise impact-oriented bullets, but do not create numeric results unless supplied by the user.
8. Use the user's language unless explicitly requested otherwise.
9. Return JSON only, with exactly this top-level structure:
{
  "assistantMessage": "short response and next question",
  "draft": {
    "version": 1,
    "title": "resume title",
    "language": "zh or en",
    "targetJob": {"title":"","company":"","jobDescription":"","matchedKeywords":[],"missingSkills":[]},
    "basic": {"name":"","title":"","email":"","phone":"","location":"","employmentStatus":"","birthDate":"","website":"","github":"","linkedin":""},
    "summary": "",
    "education": [{"school":"","major":"","degree":"","startDate":"","endDate":"","gpa":"","details":[]}],
    "experience": [{"company":"","position":"","date":"","details":[]}],
    "projects": [{"name":"","role":"","date":"","details":[],"link":""}],
    "skills": [],
    "certifications": [],
    "missingFields": [],
    "assumptions": [],
    "conflicts": [],
    "evidence": [{"field":"","source":"user statement or correction","confidence":"high or medium or low"}],
    "followUpQuestions": []
  }
}`;

const parseJsonPayload = (content: string) => {
  const direct = content.trim();
  const candidates = [direct];
  const fenced = direct.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const object = direct.match(/\{[\s\S]*\}/)?.[0];
  if (fenced) candidates.push(fenced.trim());
  if (object) candidates.push(object);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      // Try the next compatible representation.
    }
  }
  throw new Error("The AI response did not contain valid JSON");
};

const parseUpstreamError = (raw: string, fallback: string) => {
  try {
    const data = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return data.error?.message || data.message || fallback;
  } catch {
    return raw || fallback;
  }
};

const buildUserContext = (body: ResumeAgentRequest) =>
  JSON.stringify(
    {
      locale: body.locale,
      currentDraft: body.currentDraft ?? null,
      conversation: body.messages.slice(-30),
      instruction:
        "Update the complete draft using the full conversation. Return all retained fields, not a patch.",
    },
    null,
    2
  );

export const Route = createFileRoute("/api/resume-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ResumeAgentRequest;
          const modelType = body.modelType as AIModelType;
          const modelConfig = AI_MODEL_CONFIGS[modelType];
          if (
            !modelConfig ||
            !body.apiKey ||
            !Array.isArray(body.messages) ||
            (modelConfig.requiresModelId && !body.model) ||
            (modelType === "openai" && !body.apiEndpoint)
          ) {
            return Response.json({ error: "AI provider configuration is incomplete" }, { status: 400 });
          }

          let content = "";
          const userContext = buildUserContext(body);
          if (modelType === "gemini") {
            const modelInstance = getGeminiModelInstance({
              apiKey: body.apiKey,
              model: body.model || "gemini-flash-latest",
              systemInstruction: SYSTEM_PROMPT,
              generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
            });
            const result = await modelInstance.generateContent(userContext);
            content = result.response.text() || "";
          } else {
            const response = await fetch(modelConfig.url(body.apiEndpoint), {
              method: "POST",
              headers: modelConfig.headers(body.apiKey),
              body: JSON.stringify({
                model: modelConfig.requiresModelId ? body.model : modelConfig.defaultModel,
                temperature: 0.2,
                ...(modelType === "opencode" ? {} : { response_format: { type: "json_object" } }),
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: userContext },
                ],
              }),
            });
            const raw = await response.text();
            if (!response.ok) {
              return Response.json(
                { error: parseUpstreamError(raw, `Upstream API error: ${response.status}`) },
                { status: response.status }
              );
            }
            let upstream: any;
            try {
              upstream = raw ? JSON.parse(raw) : {};
            } catch {
              return Response.json(
                { error: "Invalid upstream response: expected JSON payload" },
                { status: 502 }
              );
            }
            content = upstream?.choices?.[0]?.message?.content || "";
          }

          const parsed = parseJsonPayload(content);
          const language = body.locale?.toLowerCase().startsWith("en") ? "en" : "zh";
          const draft = normalizeResumeDraft(parsed.draft, language);
          const assistantMessage =
            typeof parsed.assistantMessage === "string" && parsed.assistantMessage.trim()
              ? parsed.assistantMessage.trim()
              : draft.followUpQuestions[0] || (language === "en" ? "Draft updated." : "草稿已更新。请检查右侧内容。 ");
          return Response.json({ assistantMessage, draft });
        } catch (error) {
          console.error("Resume agent error:", error);
          return Response.json({ error: formatGeminiErrorMessage(error) }, { status: 500 });
        }
      },
    },
  },
});
