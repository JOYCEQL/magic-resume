import type { ReactNode } from "react";
import type { GlobalSettings, Publication } from "@/types/resume";
import { useLocale } from "@/i18n/compat/client";
import { getAuthorDelimiter, getPublicationAuthors, getPublicationLink, getPublicationStatusLabel, hasPublicationContent } from "@/lib/publication";
import { formatDateString, normalizeDateFormat } from "@/lib/utils";
import SectionWrapper from "./SectionWrapper";

export default function PublicationsSection({ publications = [], globalSettings, children }: {
  publications?: Publication[];
  globalSettings?: GlobalSettings;
  children: ReactNode;
}) {
  const locale = useLocale();
  // 历史版本直接输出原始日期；仅在用户显式选择日期格式后才格式化
  const dateFormat = normalizeDateFormat(globalSettings?.dateFormat);
  const items = publications.filter((item) => item.visible !== false && hasPublicationContent(item));
  if (!items.length) return null;

  return (
    <SectionWrapper sectionId="publications" style={{ marginTop: globalSettings?.sectionSpacing ?? 24 }}>
      {children}
      <div style={{ fontSize: globalSettings?.baseFontSize ?? 14, lineHeight: globalSettings?.lineHeight ?? 1.6 }}>
        {items.map((item) => {
          const link = getPublicationLink(item.link);
          const authors = getPublicationAuthors(item.authors, item.highlightedAuthor);
          const status = getPublicationStatusLabel(item.status, locale);
          return (
            <article key={item.id} data-publication-id={item.id} className="break-inside-avoid" style={{ marginTop: globalSettings?.paragraphSpacing ?? 12, overflowWrap: "anywhere" }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                {item.title && <h4 className="min-w-0 flex-1 font-bold" style={{ fontSize: globalSettings?.subheaderSize ?? 16 }}>{item.title}</h4>}
                {item.date && <span className="shrink-0 text-subtitleFont">{dateFormat ? formatDateString(item.date, locale, dateFormat) : item.date}</span>}
              </div>
              {authors.length > 0 && <p>{authors.map((author, index) => {
                const delimiter = getAuthorDelimiter(item.authors);
                return (
                  <span key={index}>{index > 0 && delimiter}{author.highlighted ? <strong>{author.name}</strong> : author.name}</span>
                );
              })}</p>}
              {(item.venue || status || link) && (
                <div className="flex flex-wrap items-baseline gap-x-2 text-subtitleFont">
                  {item.venue && <span className="italic">{item.venue}</span>}
                  {status && <span>{item.venue && <span aria-hidden="true">· </span>}{status}</span>}
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="underline underline-offset-2" aria-label={`${locale === "en" ? "Read paper" : "查看论文"}: ${item.title}`}>
                    {new URL(link).hostname === "doi.org" ? "DOI" : locale === "en" ? "Paper" : "论文链接"}
                  </a>}
                </div>
              )}
              {item.description && <p className="mt-1 whitespace-pre-wrap">{item.description}</p>}
            </article>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
