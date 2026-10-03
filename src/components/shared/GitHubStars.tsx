import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/JOYCEQL/magic-resume";
const API_URL = "https://api.github.com/repos/JOYCEQL/magic-resume";

export function GitHubStars({
  appearance = "default",
}: {
  appearance?: "default" | "landing";
}) {
  const [stars, setStars] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setStars(data.stargazers_count);
      })
      .catch((error) => {
        console.error("Error fetching GitHub stars:", error);
      });
  }, []);

  if (appearance === "landing") {
    return (
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="landing-github-button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span>Star on GitHub</span>
        {typeof stars === "number" && (
          <span className="landing-github-count">
            <Star size={12} strokeWidth={1.5} aria-hidden="true" />
            {stars.toLocaleString("en-US")}
          </span>
        )}
      </a>
    );
  }

  return (
    <motion.a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative inline-flex items-center gap-2 h-8 px-3 rounded-full",
        "bg-background/50 dark:bg-background/20 backdrop-blur-md",
        "border border-border/40 dark:border-white/20",
        "hover:border-border/80 dark:hover:border-white/40",
        "shadow-sm hover:shadow-md",
        "cursor-pointer select-none",
        "group overflow-hidden"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-[length:400%_400%] animate-gradient-xy",
          "bg-gradient-to-r from-violet-200/30 via-pink-200/30 to-cyan-200/30",
          "dark:from-violet-500/10 dark:via-pink-500/10 dark:to-cyan-500/10",
          "group-hover:from-violet-200/40 group-hover:via-pink-200/40 group-hover:to-cyan-200/40",
          "dark:group-hover:from-violet-500/15 dark:group-hover:via-pink-500/15 dark:group-hover:to-cyan-500/15",
          "transition-colors duration-500"
        )}
      />

      <motion.div
        className="relative z-10 flex items-center"
        animate={isHovered ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Star
          className={cn(
            "h-4 w-4",
            "text-yellow-500/70 dark:text-yellow-400/70",
            "transition-colors duration-300",
            isHovered && "text-yellow-500 dark:text-yellow-400"
          )}
          fill={isHovered ? "currentColor" : "none"}
        />
      </motion.div>

      <span className="relative z-10 text-sm font-medium">Star on GitHub</span>

      {stars !== null && (
        <>
          <span
            className={cn(
              "relative z-10 w-px h-3",
              "bg-border/60 dark:bg-white/20",
              "transition-colors duration-300"
            )}
          />
          <motion.span
            className="relative z-10 text-sm tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {stars?.toLocaleString()}
          </motion.span>
        </>
      )}
    </motion.a>
  );
}
