"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import EditButton from "@/components/shared/EditButton";
import TypewriterText from "./TypewriterText";

export default function AnimatedHero() {
  return (
    <section className="pt-32 pb-16 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className=" mb-6 text-5x sm:text-6xl  font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text   leading-tight tracking-tight">
              AI智能
            </span>
            <span className="">打造</span>
            完美简历
          </h1>

          <div className="flex items-center justify-center space-x-4">
            <EditButton className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity text-lg">
              免费开始使用
              <ArrowRight className="ml-2 h-5 w-5" />
            </EditButton>
            <button className="px-8 py-3 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors text-lg">
              查看演示
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
