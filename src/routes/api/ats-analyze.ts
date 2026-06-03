import { createFileRoute } from "@tanstack/react-router";
import { AIModelType, AI_MODEL_CONFIGS } from "@/config/ai";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";

const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) optimization expert. You analyze resumes against ATS best practices and return strict JSON.

Scoring rubric for each section (0-100):
- Keyword density and relevance (industry-standard terms, role keywords)
- Quantified achievements (numbers, percentages, scope)
- Action verb usage (led, built, shipped, owned, scaled)
- Formatting clarity (parseable structure, no graphics-only info)
- Length and completeness (neither too sparse nor padded)
- ATS-hostile elements (tables, images instead of text, exotic fonts mentioned)

Overall score = weighted average. Weights:
- experience: 0.30
- skills: 0.20
- selfEvaluation: 0.15
- projects: 0.15
- education: 0.10
- basic: 0.05
- certificates: 0.05
Skip missing sections and re-normalize weights.

OUTPUT REQUIREMENTS:
1. Respond with a single JSON object — no prose, no markdown fences, no commentary.
2. JSON shape:
{
  "overall": <number 0-100>,
  "language": "tr" | "en",
  "sections": {
    "<sectionId>": {
      "score": <number 0-100>,
      "summary": "<one-sentence verdict, in the resume's language>",
      "suggestions": ["<short actionable suggestion>", ...]
    }
  }
}
3. Detect the language of the resume content. Write summary and suggestions in that language.
4. Each section must have at least 1 suggestion if score < 95, max 4 suggestions.
5. Suggestions must be concrete (mention the section, not generic advice).
6. Never invent sections that weren't provided.`;

interface AnalyzeRequest {
  apiKey: string;
  model: string;
  modelType: AIModelType;
  apiEndpoint?: string;
  sections: Record<string, string>;
}

function buildUserPrompt(sections: Record<string, string>): string {
  const parts: string[] = ["Analyze the following resume sections and return JSON per the rubric.\n"];
  for (const [id, content] of Object.entries(sections)) {
    parts.push(`### Section: ${id}`);
    parts.push(content?.trim() ? content.trim() : "(empty)");
    parts.push("");
  }
  return parts.join("\n");
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // strip ```json fences if present
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  // find first { ... last }
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in AI response");
  }
  return JSON.parse(candidate.slice(first, last + 1));
}

export const Route = createFileRoute("/api/ats-analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as AnalyzeRequest;
          const { apiKey, model, modelType, apiEndpoint, sections } = body;

          const modelConfig = AI_MODEL_CONFIGS[modelType];
          if (!modelConfig) {
            return Response.json({ error: { message: "Invalid model type" } }, { status: 400 });
          }

          if (!sections || typeof sections !== "object" || Object.keys(sections).length === 0) {
            return Response.json(
              { error: { message: "No resume sections provided" } },
              { status: 400 }
            );
          }

          const userPrompt = buildUserPrompt(sections);

          let rawResponse: string;

          if (modelType === "gemini") {
            const geminiModelId = model || "gemini-flash-latest";
            const modelInstance = getGeminiModelInstance({
              apiKey,
              model: geminiModelId,
              systemInstruction: SYSTEM_PROMPT,
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
              }
            });

            const result = await modelInstance.generateContent(userPrompt);
            rawResponse = result.response.text();
          } else {
            const upstream = await fetch(modelConfig.url(apiEndpoint), {
              method: "POST",
              headers: modelConfig.headers(apiKey),
              body: JSON.stringify({
                model: modelConfig.requiresModelId ? model : modelConfig.defaultModel,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: userPrompt }
                ],
                temperature: 0.2,
                stream: false,
                response_format: { type: "json_object" }
              })
            });

            if (!upstream.ok) {
              const raw = await upstream.text();
              return Response.json(
                {
                  error: {
                    message: `Upstream API error: ${upstream.status} ${upstream.statusText}`,
                    detail: raw
                  }
                },
                { status: upstream.status }
              );
            }

            const data = (await upstream.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            rawResponse = data.choices?.[0]?.message?.content ?? "";
          }

          let parsed: unknown;
          try {
            parsed = extractJson(rawResponse);
          } catch (e) {
            return Response.json(
              {
                error: {
                  message: "Could not parse AI response as JSON",
                  raw: rawResponse?.slice(0, 800)
                }
              },
              { status: 502 }
            );
          }

          return Response.json({ result: parsed });
        } catch (error) {
          console.error("ATS analyze error:", error);
          return Response.json(
            { error: { message: formatGeminiErrorMessage(error) } },
            { status: 500 }
          );
        }
      }
    }
  }
});
