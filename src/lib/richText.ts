const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;
const EMPTY_PARAGRAPH_REGEX = /<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi;
const HTML_BREAK_REGEX = /<br\s*\/?>/gi;
const HTML_ANY_TAG_REGEX = /<\/?[^>]+>/g;
const INVISIBLE_WHITESPACE_REGEX = /[\s\u200B-\u200D\uFEFF]/g;

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * 规范化富文本内容，解决以下问题：
 * 1. 纯文本中的换行无法在 HTML 中展示；
 * 2. TipTap 产生的空 <p> 标签没有高度。
 */
export const normalizeRichTextContent = (content?: string) => {
  if (!content) return "";

  let normalized = content;

  if (!HTML_TAG_REGEX.test(content)) {
    normalized = escapeHtml(content).replace(/\r\n|\r|\n/g, "<br />");
  }

  return normalized.replace(EMPTY_PARAGRAPH_REGEX, "<p><br /></p>");
};

export const hasMeaningfulRichTextContent = (content?: string) => {
  if (!content) return false;

  if (!HTML_TAG_REGEX.test(content)) {
    return content.replace(INVISIBLE_WHITESPACE_REGEX, "").length > 0;
  }

  const plainText = content
    .replace(EMPTY_PARAGRAPH_REGEX, "")
    .replace(HTML_BREAK_REGEX, "")
    .replace(/&nbsp;/gi, " ")
    .replace(HTML_ANY_TAG_REGEX, "")
    .replace(INVISIBLE_WHITESPACE_REGEX, "");

  return plainText.length > 0;
};
