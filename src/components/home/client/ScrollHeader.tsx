"use client";
import { useState, useEffect } from "react";
import { useScroll } from "framer-motion";

interface ScrollHeaderProps {
  children: React.ReactNode;
}

export default function ScrollHeader({ children }: ScrollHeaderProps) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 0);
    });

    return () => {
      unsubscribe();
    };
  }, [scrollY]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-200 ${
        isScrolled
          ? "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
