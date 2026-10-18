import { useEffect, useId, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { searchSchoolLogos, SCHOOL_SEARCH_DELAY, SCHOOL_RESULTS_PER_VIEW, type SchoolLogoPage } from "@/utils/schoolLogoSearch";
import { logoImageSource } from "@/utils/logo";

interface Props {
  schoolName: string;
  disabled: boolean;
  onSelect: (src: string) => void;
}

export default function SchoolLogoSearch({ schoolName, disabled, onSelect }: Props) {
  const t = useTranslations("workbench.logoUploader.schoolSearch");
  const locale = useLocale();
  const [query, setQuery] = useState(schoolName);
  const [viewPage, setViewPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [composing, setComposing] = useState(false);
  const [response, setResponse] = useState<{ key: string; data: SchoolLogoPage }>();
  const [failure, setFailure] = useState<string>();
  const inputId = useId();
  const resultsId = useId();
  const term = query.normalize("NFKC").trim().replace(/\s+/g, " ");
  const upstreamPage = Math.ceil(viewPage / 2);
  const key = JSON.stringify([term.toLowerCase(), upstreamPage]);
  const data = response?.key === key ? response.data : undefined;
  const eligible = term.length >= 2 && !composing;
  const isLoading = eligible && !data && failure !== key;
  const offset = (viewPage % 2 === 0 ? 1 : 0) * SCHOOL_RESULTS_PER_VIEW;
  const results = data?.schools.slice(offset, offset + SCHOOL_RESULTS_PER_VIEW) || [];
  const hasNext = !!data && (offset + SCHOOL_RESULTS_PER_VIEW < data.schools.length || data.hasNext);

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setFailure(undefined);
    const debounce = setTimeout(() => {
      timeout = setTimeout(() => controller.abort(), 10000);
      searchSchoolLogos(term, upstreamPage, controller.signal)
        .then(data => { if (active) setResponse({ key, data }); })
        .catch(() => { if (active) setFailure(key); })
        .finally(() => clearTimeout(timeout));
    }, SCHOOL_SEARCH_DELAY);
    return () => {
      active = false;
      clearTimeout(debounce);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [term, upstreamPage, key, eligible, attempt]);

  return (
    <section className="space-y-3" aria-label={t("title")} aria-busy={isLoading || disabled}>
      <label htmlFor={inputId} className="text-sm font-medium">{t("title")}</label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={event => {
            setQuery(event.target.value.slice(0, 100));
            setViewPage(1);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder={t("placeholder")}
          aria-controls={resultsId}
          maxLength={100}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("hint")}</p>
      <div role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {isLoading ? t("loading") : !eligible ? t("enterName") : ""}
      </div>
      {failure === key && (
        <div role="alert" className="space-y-2 text-sm text-muted-foreground">
          <p>{t("error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</Button>
        </div>
      )}
      <ul id={resultsId} className="divide-y rounded-lg border" aria-label={t("results")}>
        {results.map(school => {
          const name = locale === "en" ? school.nameEn : school.name;
          const otherName = locale === "en" ? school.name : school.nameEn;
          return (
            <li key={school.id} className="flex items-center gap-1 pr-3">
              <button
                type="button"
                disabled={disabled || isLoading}
                onClick={() => onSelect(school.src)}
                aria-label={t("select", { name })}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted/40">
                  <img src={logoImageSource(school.src)} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-9 w-9 object-contain" onError={event => { event.currentTarget.hidden = true; }} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{name}</span>
                  <span className="block text-xs text-muted-foreground">{otherName}</span>
                  {school.country && <span className="block text-xs text-muted-foreground">{school.country}</span>}
                </span>
              </button>
              <a href={school.source} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-muted-foreground underline underline-offset-4" aria-label={t("sourceFor", { name })}>{t("source")}</a>
            </li>
          );
        })}
        {eligible && data && !results.length && <li role="status" className="p-4 text-sm text-muted-foreground">{t("empty")}</li>}
      </ul>
      {(data?.schools.length || viewPage > 1) ? (
        <nav aria-label={t("pagination")} className="flex items-center justify-between gap-2">
          <Button type="button" size="sm" variant="outline" disabled={viewPage === 1 || isLoading} onClick={() => setViewPage(page => page - 1)}>{t("previous")}</Button>
          <span className="text-xs text-muted-foreground">{t("page", { page: viewPage })}</span>
          <Button type="button" size="sm" variant="outline" disabled={!hasNext || isLoading} onClick={() => setViewPage(page => page + 1)}>{t("next")}</Button>
        </nav>
      ) : null}
    </section>
  );
}
