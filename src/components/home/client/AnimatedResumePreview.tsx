import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

const RESUME_LINES = [
  { label: "Profile", initial: "Software engineer", improved: "Senior Software Engineer · 8+ years building scalable systems" },
  { label: "Experience", initial: "Worked on team projects", improved: "Led 6-engineer team, shipped 12 features, improved load time 40%" },
  { label: "Skills", initial: "JavaScript, React", improved: "TypeScript · React · Node.js · PostgreSQL · AWS · CI/CD" }
];

const SCORE_STEPS = [42, 58, 71, 86, 94];

export default function AnimatedResumePreview() {
  const [score, setScore] = useState(SCORE_STEPS[0]);
  const [lineState, setLineState] = useState<("initial" | "improved")[]>(
    RESUME_LINES.map(() => "initial")
  );
  const [improving, setImproving] = useState(false);

  useEffect(() => {
    const cycle = async () => {
      // Reset
      setScore(SCORE_STEPS[0]);
      setLineState(RESUME_LINES.map(() => "initial"));
      setImproving(false);

      await sleep(1400);
      setImproving(true);
      await sleep(700);

      for (let i = 0; i < RESUME_LINES.length; i++) {
        setLineState((prev) => {
          const next = [...prev];
          next[i] = "improved";
          return next;
        });
        setScore(SCORE_STEPS[Math.min(i + 1, SCORE_STEPS.length - 1)]);
        await sleep(900);
      }

      setScore(SCORE_STEPS[SCORE_STEPS.length - 1]);
      setImproving(false);
      await sleep(2800);
    };

    let mounted = true;
    const loop = async () => {
      while (mounted) {
        await cycle();
      }
    };
    loop();

    return () => {
      mounted = false;
    };
  }, []);

  const scoreColor =
    score >= 85
      ? "text-emerald-500"
      : score >= 65
      ? "text-brand-orange"
      : "text-brand-orange-soft";

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Gradient backdrop */}
      <div className="absolute -inset-8 bg-gradient-to-tr from-brand-purple/20 via-brand-orange/10 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        {/* Resume card */}
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-secondary/40">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            <div className="ml-3 text-xs text-muted-foreground font-mono">resume.pdf</div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Ada Yılmaz</div>
              <div className="h-2 w-32 rounded bg-muted/80 mb-3" />
              <div className="h-1.5 w-44 rounded bg-muted/50" />
            </div>

            {RESUME_LINES.map((line, i) => (
              <div key={i} className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                  {line.label}
                </div>
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={lineState[i]}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35 }}
                      className={
                        lineState[i] === "improved"
                          ? "text-sm sm:text-[15px] font-medium text-foreground"
                          : "text-sm sm:text-[15px] text-muted-foreground"
                      }
                    >
                      {lineState[i] === "improved" ? line.improved : line.initial}
                    </motion.div>
                  </AnimatePresence>
                  {lineState[i] === "improved" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute -left-6 top-0.5 text-emerald-500"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI optimizing overlay */}
          <AnimatePresence>
            {improving && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/95 text-white text-xs font-medium shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimizing with AI…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ATS score panel */}
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                ATS Score
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <motion.div
              key={score}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className={`text-5xl font-serif font-semibold tracking-tight ${scoreColor}`}
            >
              {score}
              <span className="text-xl text-muted-foreground/60 font-sans font-normal">/100</span>
            </motion.div>
          </div>

          <div className="space-y-3 mt-6">
            {[
              { label: "Summary", target: Math.min(score + 4, 100) },
              { label: "Experience", target: score },
              { label: "Skills", target: Math.max(score - 6, 0) }
            ].map((row, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-foreground font-medium tabular-nums">{row.target}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    animate={{ width: `${row.target}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-orange"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}
