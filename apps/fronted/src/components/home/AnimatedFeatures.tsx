"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layout, Layers, Cloud, Sparkles, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "智能排版",
    description: "AI自动优化布局，告别繁琐调整",
    icon: Layout,
    gradient: "from-blue-500 to-cyan-500",
    delay: 0,
  },
  {
    title: "一键生成",
    description: "输入基本信息，AI助手帮你完成剩余内容",
    icon: Sparkles,
    gradient: "from-violet-500 to-purple-500",
    delay: 0.1,
  },
  {
    title: "多端同步",
    description: "随时随地编辑，数据实时云端同步",
    icon: Cloud,
    gradient: "from-pink-500 to-rose-500",
    delay: 0.2,
  },
  {
    title: "极速体验",
    description: "毫秒级响应，流畅的编辑体验",
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    delay: 0.3,
  },
  {
    title: "安全可靠",
    description: "数据安全加密，保护你的隐私",
    icon: Shield,
    gradient: "from-emerald-500 to-green-500",
    delay: 0.4,
  },
  {
    title: "专业模板",
    description: "海量精选模板，一键套用",
    icon: Layers,
    gradient: "from-blue-500 to-indigo-500",
    delay: 0.5,
  },
];

export default function AnimatedFeatures() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-black" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text inline-block"
          >
            强大的功能特性
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            集成多项创新技术，为你提供极致的简历制作体验
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
              <div className="relative p-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-transparent dark:hover:border-transparent transition-colors duration-300">
                <div className={cn(
                  "w-12 h-12 rounded-lg mb-6 p-2.5",
                  "bg-gradient-to-br",
                  feature.gradient
                )}>
                  <feature.icon className="w-full h-full text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
