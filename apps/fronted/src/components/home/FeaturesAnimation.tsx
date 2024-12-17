"use client";

import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

interface FeaturesAnimationProps extends PropsWithChildren {
  index: number;
}

export function FeaturesAnimation({ children, index }: FeaturesAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}