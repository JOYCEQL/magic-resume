import { AI_MODEL_CONFIGS } from "../../config/ai";
import { ensureServerProxyDispatcher } from "./proxy";

export type ResumeImportModelType = "gemini" | "deepseek";

export const DEEPSEEK_VISION_MODEL = "deepseek-v4-flash-vision-exp";

export const normalizeResumeImportModelType = (
  value: unknown,
): ResumeImportModelType | null => {
  if (value === undefined || value === null || value === "") {
    return "gemini";
  }

  return value === "gemini" || value === "deepseek" ? value : null;
};

const DEFAULT_IMPORT_INSTRUCTION =
  "请识别以下简历页面图片中的信息，并严格按 JSON 结构输出。";

export const getResumeImportSystemPrompt = (locale?: string): string => {
  const language = locale === "en" ? "English" : "Chinese";

  return `你是一个专业的简历结构化助手。根据用户提供的简历内容，提取信息并只输出一个合法 JSON 对象。

输出约束：
1. 只允许输出 JSON，不要输出 Markdown，不要输出解释。
2. 如果某个字段不确定，使用空字符串或空数组。
3. 请使用 ${language} 输出内容文本。
4. description/details 字段输出字符串数组，每一项为一句可读内容。

JSON 结构：
{
  "title": "简历标题",
  "basic": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "employementStatus": "",
    "birthDate": ""
  },
  "education": [
    {
      "school": "",
      "major": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "description": ["", ""]
    }
  ],
  "experience": [
    {
      "company": "",
      "position": "",
      "date": "",
      "details": ["", ""]
    }
  ],
  "projects": [
    {
      "name": "",
      "role": "",
      "date": "",
      "description": ["", ""],
      "link": "",
      "linkLabel": ""
    }
  ],
  "skills": ["", ""]
}`;
};

const isResumeObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseResumeJson = (
  content: string,
): Record<string, unknown> | null => {
  if (typeof content !== "string") {
    return null;
  }

  const text = content.trim();
  if (!text) {
    return null;
  }

  const tryParse = (candidate: string): Record<string, unknown> | null => {
    try {
      const parsed: unknown = JSON.parse(candidate);
      return isResumeObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(text);
  if (direct) {
    return direct;
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed) {
      return parsed;
    }
  }

  const objectBlock = text.match(/\{[\s\S]*\}/);
  return objectBlock?.[0] ? tryParse(objectBlock[0]) : null;
};

type DeepSeekTextContent = {
  type: "text";
  text: string;
};

type DeepSeekImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail: "original";
  };
};

type DeepSeekPayload = {
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string | Array<DeepSeekTextContent | DeepSeekImageContent>;
  }>;
  thinking: { type: "disabled" };
  temperature: number;
  max_tokens: number;
  response_format: { type: "json_object" };
};

export const buildDeepSeekVisionPayload = (params: {
  images: string[];
  locale?: string;
  content?: string;
}): DeepSeekPayload => ({
  model: DEEPSEEK_VISION_MODEL,
  messages: [
    {
      role: "system",
      content: getResumeImportSystemPrompt(params.locale),
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: params.content || DEFAULT_IMPORT_INSTRUCTION,
        },
        ...params.images.map((url) => ({
          type: "image_url" as const,
          image_url: {
            url,
            detail: "original" as const,
          },
        })),
      ],
    },
  ],
  thinking: { type: "disabled" },
  temperature: 0.2,
  max_tokens: 8192,
  response_format: { type: "json_object" },
});

export class ResumeImportUpstreamError extends Error {
  status: number;
  details?: string;
  code?: string;

  constructor(
    message: string,
    status: number,
    details?: string,
    code?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ResumeImportUpstreamError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getUpstreamErrorMessage = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (isRecord(error) && typeof error.message === "string" && error.message) {
    return error.message;
  }

  return typeof payload.message === "string" && payload.message
    ? payload.message
    : null;
};

const getUpstreamErrorCode = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (isRecord(error) && typeof error.code === "string" && error.code) {
    return error.code;
  }

  return typeof payload.code === "string" && payload.code ? payload.code : null;
};

const readResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

export const requestDeepSeekResumeImport = async (
  params: {
    apiKey: string;
    images: string[];
    locale?: string;
    content?: string;
  },
  fetcher: typeof fetch = fetch,
  prepareNetwork: () => void = ensureServerProxyDispatcher,
): Promise<Record<string, unknown>> => {
  const config = AI_MODEL_CONFIGS.deepseek;
  prepareNetwork();

  let response: Response;
  try {
    response = await fetcher(config.url(), {
      method: "POST",
      headers: config.headers(params.apiKey),
      body: JSON.stringify(buildDeepSeekVisionPayload(params)),
    });
  } catch (error) {
    throw new ResumeImportUpstreamError(
      "Unable to reach DeepSeek API",
      502,
      undefined,
      "network_error",
      { cause: error },
    );
  }

  const responseText = await readResponseText(response);
  let responsePayload: unknown;
  try {
    responsePayload = responseText ? JSON.parse(responseText) : null;
  } catch {
    responsePayload = null;
  }

  if (!response.ok) {
    const upstreamMessage =
      getUpstreamErrorMessage(responsePayload) ||
      `DeepSeek request failed: ${response.status} ${response.statusText}`;
    const code = getUpstreamErrorCode(responsePayload);
    throw new ResumeImportUpstreamError(
      "DeepSeek API request failed",
      response.status,
      upstreamMessage,
      code || undefined,
    );
  }

  if (!responsePayload) {
    throw new ResumeImportUpstreamError(
      "DeepSeek returned an invalid JSON response",
      502,
    );
  }

  const choices = isRecord(responsePayload) ? responsePayload.choices : null;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const message = isRecord(firstChoice) ? firstChoice.message : null;
  const content = isRecord(message) ? message.content : null;

  if (typeof content !== "string" || !content.trim()) {
    throw new ResumeImportUpstreamError(
      "DeepSeek response did not include resume content",
      502,
    );
  }

  const resume = parseResumeJson(content);
  if (!resume) {
    throw new ResumeImportUpstreamError(
      "Failed to parse DeepSeek resume JSON output",
      502,
    );
  }

  return resume;
};
