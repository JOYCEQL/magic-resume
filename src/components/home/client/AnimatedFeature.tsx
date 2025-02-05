"use client";
import { motion } from "framer-motion";

interface AnimatedFeatureProps {
  children: React.ReactNode;
  delay?: number;
}

export default function AnimatedFeature({ children, delay = 0 }: AnimatedFeatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
