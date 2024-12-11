"use client";

import React, { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
}

export default function TypewriterText({ text }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(
        () => {
          setDisplayText((prev) => prev + text[currentIndex]);
          setCurrentIndex((c) => c + 1);
        },
        50 + Math.random() * 50
      );
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className="relative">
      {displayText}
      <span className="absolute -right-1 top-1/4 h-1/2 w-0.5 bg-blue-500 animate-pulse" />
    </span>
  );
}
