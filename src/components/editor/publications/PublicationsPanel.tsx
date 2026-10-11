import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ThemeModal from "@/components/shared/ThemeModal";
import Field from "@/components/editor/Field";
import { useResumeStore } from "@/store/useResumeStore";
import { generateUUID } from "@/utils/uuid";
import { cn } from "@/lib/utils";
import { cleanAuthorName, getPublicationLink, PUBLICATION_STATUSES, splitAuthors } from "@/lib/publication";
import type { Publication } from "@/types/resume";

function PublicationItem({ item, expanded, onToggle, onChange, onDelete, onMove, index, count }: {
  item: Publication;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Publication>) => void;
  onDelete: () => void;
  onMove: (direction: number) => void;
  index: number;
  count: number;
}) {
  const t = useTranslations("workbench.publicationsPanel");
  const controls = useDragControls();
  const id = useId();
  const [deleting, setDeleting] = useState(false);
  const invalidLink = !!item.link.trim() && !getPublicationLink(item.link);

  const resumeOwnerName = useResumeStore((state) => state.activeResume?.basic?.name?.trim() || "");
  const authorList = useMemo(() => splitAuthors(item.authors), [item.authors]);
  const currentHighlighted = cleanAuthorName(item.highlightedAuthor || "");

  const inputField = (field: "title" | "venue" | "link") => (
    <div className="space-y-1.5">
      <label htmlFor={`${id}-${field}`} className="text-sm font-medium">{t(`labels.${field}`)}</label>
      {field === "title" ? (
        <Textarea id={`${id}-${field}`} value={item[field]} onChange={(event) => onChange({ [field]: event.target.value })}
          placeholder={t(`placeholders.${field}`)} rows={2} className="min-h-[68px] resize-y leading-relaxed" />
      ) : (
        <Input id={`${id}-${field}`} value={item[field]} onChange={(event) => onChange({ [field]: event.target.value })}
          placeholder={t(`placeholders.${field}`)} aria-invalid={field === "link" && invalidLink}
          aria-describedby={field === "link" && invalidLink ? `${id}-link-error` : undefined} />
      )}
      {field === "link" && invalidLink && <p id={`${id}-link-error`} className="text-xs text-destructive">{t("invalidLink")}</p>}
    </div>
  );

  return (
    <Reorder.Item value={item} layout="position" dragListener={false} dragControls={controls} className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start gap-1 px-2 py-2">
        <button type="button" className="mt-1 flex h-9 w-6 shrink-0 touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("reorder")} title={t("reorder")} onPointerDown={(event) => controls.start(event)}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 rounded px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={expanded} aria-controls={`${id}-content`} onClick={onToggle}>
          <span className={cn("block truncate text-sm font-medium", item.visible === false && "text-muted-foreground")}>{item.title || t("untitled")}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{[item.venue, item.date, item.status && t(`statuses.${item.status}`)].filter(Boolean).join(" · ") || t("itemHint")}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 pt-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={item.visible === false ? t("show") : t("hide")} title={item.visible === false ? t("show") : t("hide")}
            onClick={() => onChange({ visible: item.visible === false })}>{item.visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={t("delete")} title={t("delete")} onClick={() => setDeleting(true)}><Trash2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={expanded ? t("collapse") : t("expand")} aria-expanded={expanded} aria-controls={`${id}-content`} onClick={onToggle}>
            <motion.span initial={false} animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="flex">
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            id={`${id}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
          <div className="space-y-4 border-t border-border p-4">
          {inputField("title")}
          <div className="space-y-1.5">
            <label htmlFor={`${id}-authors`} className="text-sm font-medium">{t("labels.authors")}</label>
            <Textarea
              id={`${id}-authors`}
              value={item.authors}
              onChange={(event) => onChange({ authors: event.target.value })}
              placeholder={t("placeholders.authors")}
              rows={2}
              className="min-h-[68px] resize-y leading-relaxed"
              aria-describedby={`${id}-authors-hint`}
            />
            <p id={`${id}-authors-hint`} className="text-xs leading-relaxed text-muted-foreground">{t("authorsHint")}</p>

            {authorList.length > 0 && (
              <div className="rounded-lg border border-border/80 bg-muted/30 p-2.5 space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="inline-block w-1 h-3 rounded-full bg-primary" />
                    <span>{t("selectSelf")}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">（{t("selectSelfHint")}）</span>
                  </span>
                  {currentHighlighted && (
                    <button
                      type="button"
                      onClick={() => onChange({ highlightedAuthor: "" })}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      {t("clearHighlight")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {authorList.map((author, index) => {
                    const clean = cleanAuthorName(author);
                    const isSelected = !!currentHighlighted && clean.toLocaleLowerCase() === currentHighlighted.toLocaleLowerCase();
                    const isOwner = !!resumeOwnerName && clean.toLocaleLowerCase() === resumeOwnerName.toLocaleLowerCase();
                    return (
                      <button
                        key={`${author}-${index}`}
                        type="button"
                        onClick={() => onChange({ highlightedAuthor: isSelected ? "" : clean })}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-background border border-border/80 hover:bg-muted text-foreground hover:border-primary/50"
                        )}
                        title={isSelected ? t("clearHighlight") : `${t("selectSelf")}: ${clean}`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                        <span>{author}</span>
                        {isOwner && !isSelected && (
                          <span className="ml-0.5 rounded px-1 py-0.2 text-[10px] bg-muted text-muted-foreground font-normal">
                            {t("selfBadge")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {inputField("venue")}
          <div className="grid grid-cols-2 items-start gap-3">
            <Field label={t("labels.date")} value={item.date} onChange={(date) => onChange({ date })} type="date" />
            <div>
              <label htmlFor={`${id}-status`} className="mb-1.5 block text-sm font-medium">{t("labels.status")}</label>
              <Select value={item.status || "none"} onValueChange={(value) => onChange({ status: value === "none" ? "" : value as Publication["status"] })}>
                <SelectTrigger id={`${id}-status`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("statuses.none")}</SelectItem>
                  {PUBLICATION_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`statuses.${status}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {inputField("link")}
          <details className="group" open={item.description ? true : undefined}>
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">{t("labels.description")}</summary>
            <label htmlFor={`${id}-description`} className="sr-only">{t("labels.description")}</label>
            <Textarea id={`${id}-description`} value={item.description} onChange={(event) => onChange({ description: event.target.value })}
              placeholder={t("placeholders.description")} rows={3} className="mt-3 min-h-[80px] resize-y" />
          </details>
          {count > 1 && <div className="flex gap-2 border-t border-border pt-3">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="mr-1 h-3.5 w-3.5" />{t("moveUp")}</Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown className="mr-1 h-3.5 w-3.5" />{t("moveDown")}</Button>
          </div>}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ThemeModal isOpen={deleting} title={item.title || t("untitled")} onClose={() => setDeleting(false)} onConfirm={onDelete} />
    </Reorder.Item>
  );
}

export default function PublicationsPanel() {
  const t = useTranslations("workbench.publicationsPanel");
  const { activeResume, updateResume } = useResumeStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!activeResume) return null;
  const items = activeResume.publications ?? [];
  const save = (publications: Publication[]) => updateResume(activeResume.id, { publications });
  const add = () => {
    const id = generateUUID();
    save([...items, { id, title: "", authors: "", highlightedAuthor: "", venue: "", date: "", status: "", link: "", description: "", visible: true }]);
    setExpandedId(id);
  };

  return (
    <div className="space-y-4 p-4" data-testid="publications-panel">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
          <BookOpen className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t("emptyTitle")}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("emptyDescription")}</p>
          <Button onClick={add} className="mt-5"><Plus className="mr-2 h-4 w-4" />{t("addFirst")}</Button>
        </div>
      ) : (
        <>
          <Reorder.Group axis="y" values={items} onReorder={save} className="space-y-3">
            {items.map((item, index) => <PublicationItem key={item.id} item={item} index={index} count={items.length} expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onChange={(patch) => save(items.map((entry) => entry.id === item.id ? { ...entry, ...patch } : entry))}
              onDelete={() => { save(items.filter((entry) => entry.id !== item.id)); if (expandedId === item.id) setExpandedId(null); }}
              onMove={(direction) => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; save(next); }} />)}
          </Reorder.Group>
          <Button onClick={add} variant="outline" className="w-full border-dashed"><Plus className="mr-2 h-4 w-4" />{t("add")}</Button>
        </>
      )}
    </div>
  );
}
