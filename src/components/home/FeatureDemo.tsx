import {
  ArrowDown,
  ArrowRight,
  Check,
  FileText,
  FolderClosed,
  HardDrive,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";

export type DemoKind = "polish" | "grammar" | "local" | "export";

function FlowConnector({ className = "" }: { className?: string }) {
  return (
    <div className={`demo-connector ${className}`}>
      <span className="demo-flow-line" />
      <span className="demo-flow-arrow"><ArrowDown size={15} strokeWidth={1.6} /></span>
    </div>
  );
}

export default function FeatureDemo({ kind }: { kind: DemoKind }) {
  const t = useTranslations("home.redesign.illustrations");

  return (
    <div className={`feature-demo feature-demo-${kind}`} aria-hidden="true">
      <span className="feature-demo-grid" />
      <span className="feature-demo-glow" />
      <div className="feature-demo-content" key={kind}>
        {kind === "polish" && (
          <>
            <div className="demo-draft">
              <span className="demo-eyebrow">{t("draft")}</span>
              <p>{t("before")}</p>
            </div>
            <FlowConnector />
            <div className="demo-paper demo-polished">
              <div className="demo-paper-heading">
                <span><Sparkles size={16} />{t("polished")}</span>
                <Check size={16} />
              </div>
              <p>{t("after")}</p>
              <div className="demo-paper-footer">
                <span>{t("clear")}</span><span>{t("yourVoice")}</span>
              </div>
            </div>
          </>
        )}
        {kind === "grammar" && (
          <div className="demo-paper demo-proofreading">
            <div className="demo-paper-heading"><span><FileText size={16} />{t("experience")}</span></div>
            <div className="demo-proof-lines"><span /><span /></div>
            <p className="demo-proof-sentence">
              {t("grammarStart")}
              <span className="demo-correction"><del>{t("grammarError")}</del><ins>{t("grammarCorrect")}</ins></span>
              {t("grammarEnd")}
            </p>
            <div className="demo-proof-lines"><span /><span /></div>
            <div className="demo-correction-note">
              <span className="demo-check"><Check size={15} /></span>
              <span>{t("corrected")}</span>
              <span className="demo-correction-pair">{t("grammarError")}<ArrowRight size={13} />{t("grammarCorrect")}</span>
            </div>
          </div>
        )}
        {kind === "local" && (
          <>
            <div className="demo-device-label"><HardDrive size={17} />{t("yourDevice")}</div>
            <div className="demo-archive">
              <div className="demo-archive-heading"><FolderClosed size={19} /><span>{t("yourResume")}</span><LockKeyhole size={14} /></div>
              {["resume.json", "resume.pdf"].map((file, index) => (
                <div className="demo-archive-file" style={{ animationDelay: `${index * 140}ms` }} key={file}>
                  <span className="demo-file-icon"><FileText size={20} strokeWidth={1.3} /></span>
                  <span><strong>{file}</strong><small>{t(index === 0 ? "backup" : "apply")}</small></span>
                  <Check size={15} />
                </div>
              ))}
              <div className="demo-archive-status"><span />{t("localTitle")}</div>
            </div>
          </>
        )}
        {kind === "export" && (
          <>
            <div className="demo-export-source"><FileText size={25} strokeWidth={1.2} /><span>{t("yourResume")}</span></div>
            <FlowConnector className="demo-export-connector" />
            <div className="demo-format-grid">
              {[
                { name: "PDF", label: t("apply") },
                { name: "PNG", label: t("share") },
                { name: "JSON", label: t("backup") },
                { name: "Markdown", label: ".md" },
              ].map((format, index) => (
                <div className="demo-format" key={format.name} style={{ animationDelay: `${index * 100 + 100}ms` }}>
                  <FileText size={20} strokeWidth={1.2} />
                  <strong>{format.name}</strong><small>{format.label}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
