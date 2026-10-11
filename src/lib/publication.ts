import type { Publication, PublicationStatus } from "@/types/resume";

export const PUBLICATION_STATUSES = ["published", "accepted", "preprint", "submitted"] as const;

export const publicationStatusLabels: Record<"zh" | "en", Record<PublicationStatus, string>> = {
  zh: { "": "", published: "已发表", accepted: "已录用", preprint: "预印本", submitted: "在投" },
  en: { "": "", published: "Published", accepted: "Accepted", preprint: "Preprint", submitted: "Submitted" },
};

export const getPublicationStatusLabel = (status: PublicationStatus, locale: string) =>
  publicationStatusLabels[locale === "en" ? "en" : "zh"][status] || "";

/** Only link to HTTP(S), including bare DOIs and protocol-less web addresses. */
export function getPublicationLink(value: string) {
  const trimmed = value.trim();
  const doi = trimmed.replace(/^doi:\s*/i, "");
  if (!doi || /[\s\u0000-\u001f\u007f]/.test(doi)) return null;
  const candidate = /^10\.\d{4,9}\/.+/i.test(doi)
    ? `https://doi.org/${doi}`
    : /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Clean symbols like equal contribution asterisks or dagger marks */
export function cleanAuthorName(name: string): string {
  return name.replace(/[\s*†‡#]+$/, "").trim();
}

/** Delimiters: semicolons and newlines first, then Chinese commas/enumeration marks, then commas */
export function splitAuthors(authors: string): string[] {
  if (!authors.trim()) return [];
  if (/[;；\n]/.test(authors)) {
    return authors.split(/[;；\n]/).map((s) => s.trim()).filter(Boolean);
  }
  if (/[，、]/.test(authors)) {
    return authors.split(/[，、]/).map((s) => s.trim()).filter(Boolean);
  }
  if (/,/.test(authors)) {
    return authors.split(/,/).map((s) => s.trim()).filter(Boolean);
  }
  return [authors.trim()];
}

export function getAuthorDelimiter(authors: string): string {
  if (authors.includes("、")) return "、";
  if (authors.includes("，")) return "，";
  if (authors.includes("；")) return "；";
  return "; ";
}

/** Semicolons/newlines/commas delimit authors; commas can belong to "Surname, Initials" when semicolons exist. */
export function getPublicationAuthors(authors: string, highlightedAuthor: string) {
  const highlight = cleanAuthorName(highlightedAuthor).toLocaleLowerCase();
  return splitAuthors(authors).map((name) => ({
    name,
    highlighted: !!highlight && cleanAuthorName(name).toLocaleLowerCase() === highlight,
  }));
}

export function hasPublicationContent(publication: Publication) {
  return [publication.title, publication.authors, publication.venue, publication.date, publication.link, publication.description]
    .some((value) => value?.trim());
}
