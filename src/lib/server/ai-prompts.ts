import {
  defaultLocale,
  importLanguages,
  type Locale,
} from "@/i18n/config";

const RESUME_JSON_SCHEMA = `{
  "title": "Resume title",
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

export function resolveApiLocale(locale?: string): Locale {
  if (locale && locale in importLanguages) {
    return locale as Locale;
  }
  return defaultLocale;
}

export function buildResumeImportPrompt(locale: Locale): string {
  const language = importLanguages[locale];

  return `You are a professional resume structuring assistant. Extract information from the user's resume content and output exactly one valid JSON object.

Output constraints:
1. Output JSON only. No Markdown, no explanations.
2. If a field is uncertain, use an empty string or empty array.
3. Write all text content in ${language}.
4. description/details fields must be string arrays; each item is one readable sentence.

JSON schema:
${RESUME_JSON_SCHEMA}`;
}

export function buildResumeImportUserPrompt(
  locale: Locale,
  hasContent: boolean
): string {
  if (hasContent) {
    return "";
  }

  const prompts: Record<Locale, string> = {
    zh: "请识别以下简历页面图片中的信息，并严格按 JSON 结构输出。",
    en: "Extract information from the resume page images below and output strictly according to the JSON schema.",
    ru: "Извлеките информацию со страниц резюме ниже и выведите строго в соответствии со схемой JSON.",
  };

  return prompts[locale];
}

const GRAMMAR_PROMPTS: Record<Locale, string> = {
  zh: `你是一个专业的中文简历校对助手。你的任务是**仅**找出简历中的**错别字**和**标点符号错误**。

**严格禁止**：
1. ❌ **禁止**提供任何风格、语气、润色或改写建议。如果句子在语法上是正确的（即使读起来不够优美），也**绝对不要**报错。
2. ❌ **禁止**报告“无明显错误”或类似的信息。如果没有发现错别字或标点错误，"errors" 数组必须为空。
3. ❌ **禁止**对专业术语进行过度纠正，除非通过上下文非常确定是打字错误。

**仅检查以下两类错误**：
1. ✅ **错别字**：例如将“作为”写成“做为”，将“经理”写成“经里”。
2. ✅ **严重标点错误**：仅报告重复标点（如“，，”）或完全错误的符号位置。

**重要例外（绝不报错）**：
- ❌ **忽略中英文标点混用**：在技术简历中，中文内容使用英文标点是可接受的。**绝对不要**报告此类“错误”。
- ❌ **忽略空格使用**：不要报告中英文之间的空格遗漏或多余。

返回格式（JSON）：
{
  "errors": [
    {
      "context": "包含错误的完整句子（必须是原文）",
      "text": "具体的错误部分（必须是原文中实际存在的字符串）",
      "suggestion": "仅包含修正后的词汇或片段",
      "type": "spelling"
    }
  ]
}

"type" must be either "spelling" or "punctuation". Do not include a free-form "reason" field.`,

  en: `You are a professional English resume proofreading assistant. Find **only** spelling mistakes and serious punctuation errors.

**Strictly forbidden**:
1. Do not suggest style, tone, polish, or rewrites. If a sentence is grammatically correct, do not report it.
2. If no spelling or punctuation errors are found, return an empty "errors" array.
3. Do not over-correct technical terms unless clearly a typo.

**Check only**:
1. Spelling mistakes (typos).
2. Serious punctuation errors (duplicate punctuation, clearly wrong symbol placement).

**Ignore**:
- Mixed punctuation styles common in tech resumes.
- Optional spacing around punctuation.

Return JSON:
{
  "errors": [
    {
      "context": "Full sentence containing the error (exact original text)",
      "text": "The erroneous substring (must exist in the original)",
      "suggestion": "Corrected word or fragment only",
      "type": "spelling"
    }
  ]
}

"type" must be either "spelling" or "punctuation". Do not include a free-form "reason" field.`,

  ru: `Вы — профессиональный корректор русскоязычных резюме. Находите **только** орфографические ошибки и серьёзные пунктуационные ошибки.

**Строго запрещено**:
1. Не предлагайте стилистические правки, перефразирование или улучшение формулировок.
2. Если ошибок нет, верните пустой массив "errors".
3. Не исправляйте профессиональную терминологию без явной опечатки.

**Проверяйте только**:
1. Орфографические ошибки (опечатки).
2. Серьёзные пунктуационные ошибки (дублирование знаков, явно неверное расположение).

**Игнорируйте**:
- Смешанную пунктуацию, типичную для IT-резюме.
- Пробелы вокруг знаков препинания.

Формат ответа (JSON):
{
  "errors": [
    {
      "context": "Полное предложение с ошибкой (точный оригинальный текст)",
      "text": "Ошибочный фрагмент (должен существовать в оригинале)",
      "suggestion": "Только исправленное слово или фрагмент",
      "type": "spelling"
    }
  ]
}

"type" must be either "spelling" or "punctuation". Do not include a free-form "reason" field.`,
};

export function buildGrammarPrompt(locale: Locale): string {
  return GRAMMAR_PROMPTS[locale];
}

const POLISH_PROMPTS: Record<Locale, string> = {
  zh: `你是一个专业的简历优化助手。请帮助优化以下 Markdown 格式的文本，使其更加专业和有吸引力。

优化原则：
1. 使用更专业的词汇和表达方式
2. 突出关键成就和技能
3. 保持简洁清晰
4. 使用主动语气
5. 保持原有信息的完整性
6. 严格保留原有的 Markdown 格式结构

输出强约束（必须遵守）：
1. 只能输出“润色后的正文内容”本身。
2. 禁止输出任何前言、说明、总结、附加建议。
3. 禁止使用 Markdown 代码块包裹结果。`,

  en: `You are a professional resume optimization assistant. Polish the following Markdown text to make it more professional and compelling.

Principles:
1. Use professional vocabulary and phrasing
2. Highlight key achievements and skills
3. Keep it concise and clear
4. Use active voice
5. Preserve all original information
6. Strictly preserve the original Markdown structure

Output constraints:
1. Output only the polished body text.
2. No preface, explanation, summary, or extra suggestions.
3. Do not wrap the result in Markdown code blocks.`,

  ru: `Вы — профессиональный ассистент по оптимизации резюме. Отполируйте следующий Markdown-текст, сделав его более профессиональным и убедительным.

Принципы:
1. Используйте профессиональную лексику и формулировки
2. Выделяйте ключевые достижения и навыки
3. Будьте лаконичны и ясны
4. Используйте активный залог
5. Сохраняйте всю исходную информацию
6. Строго сохраняйте исходную структуру Markdown

Ограничения вывода:
1. Выводите только отполированный текст.
2. Без вступлений, пояснений, резюме и дополнительных советов.
3. Не оборачивайте результат в блоки Markdown-кода.`,
};

export function buildPolishPrompt(
  locale: Locale,
  customInstructions?: string
): string {
  let prompt = POLISH_PROMPTS[locale];

  if (customInstructions?.trim()) {
    const labels: Record<Locale, string> = {
      zh: "用户额外要求",
      en: "Additional user instructions",
      ru: "Дополнительные требования пользователя",
    };
    prompt += `\n\n${labels[locale]}:\n${customInstructions.trim()}`;
  }

  return prompt;
}
