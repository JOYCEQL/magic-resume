"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/JOYCEQL/magic-resume";
const API_URL = "https://api.github.com/repos/JOYCEQL/magic-resume";

export function GitHubStars() {
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
        className="relative z-10"
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
            {stars.toLocaleString()}
          </motion.span>
        </>
      )}
    </motion.a>
  );
}
