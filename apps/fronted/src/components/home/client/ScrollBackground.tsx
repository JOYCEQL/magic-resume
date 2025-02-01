"use client";
import { motion, useScroll } from "framer-motion";

export default function ScrollBackground() {
  const { scrollY } = useScroll();

  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 md:opacity-100" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 md:opacity-100" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 rounded-full blur-3xl opacity-30 md:opacity-60" />
      <motion.div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "url('/patterns/grid.svg')",
          backgroundSize: "30px 30px",
          y: scrollY,
        }}
      />
    </div>
  );
}
