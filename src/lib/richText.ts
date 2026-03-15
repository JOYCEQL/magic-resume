const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;
const EMPTY_PARAGRAPH_REGEX = /<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi;
const HTML_BREAK_REGEX = /<br\s*\/?>/gi;
const HTML_ANY_TAG_REGEX = /<\/?[^>]+>/g;
const INVISIBLE_WHITESPACE_REGEX = /[\s\u200B-\u200D\uFEFF]/g;
const RICH_TEXT_ANCHOR_REGEX = /<a\b([^>]*)>/gi;
const CLASS_ATTRIBUTE_REGEX = /\bclass\s*=\s*("([^"]*)"|'([^']*)')/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_REGEX =
  /^(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[/?#][^\s]*)?$/i;
const SAFE_LINK_PROTOCOL_REGEX = /^(https?:|mailto:|tel:)/i;
const ANY_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/i;

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const decorateRichTextAnchors = (content: string) =>
  content.replace(RICH_TEXT_ANCHOR_REGEX, (match, attrs: string) => {
    if (CLASS_ATTRIBUTE_REGEX.test(attrs)) {
      return match.replace(CLASS_ATTRIBUTE_REGEX, (_classMatch, quotedValue, doubleQuoted, singleQuoted) => {
        const currentValue = doubleQuoted ?? singleQuoted ?? quotedValue ?? "";
        const classes = currentValue.split(/\s+/).filter(Boolean);

        if (!classes.includes("rich-text-link")) {
          classes.push("rich-text-link");
        }

        return `class="${classes.join(" ")}"`;
      });
    }

    return `<a class="rich-text-link"${attrs}>`;
  });

export const normalizeLinkHref = (href?: string) => {
  if (!href) return null;

  const value = href.trim();
  if (!value) return null;

  if (SAFE_LINK_PROTOCOL_REGEX.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (EMAIL_REGEX.test(value)) {
    return `mailto:${value}`;
  }

  if (DOMAIN_REGEX.test(value)) {
    return `https://${value}`;
  }

  if (ANY_PROTOCOL_REGEX.test(value)) {
    return null;
  }

  return null;
};

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

  return decorateRichTextAnchors(normalized).replace(
    EMPTY_PARAGRAPH_REGEX,
    "<p><br /></p>"
  );
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
