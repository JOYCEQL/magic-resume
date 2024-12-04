"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Moon,
  Layout,
  Layers,
  Shield,
  Cloud,
  ChevronRight
} from "lucide-react";
import ScrollToTop from "../components/shared/ScrollToTop";
import EditButton from "@/components/shared/EditButton";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/shared/ThemeToggle";

const TypewriterText = ({ text }) => {
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
};

const FeatureGrid = () => {
  const brandFeature = {
    title: "Magic Resume",
    subtitle: "AI驱动的智能简历系统",
    tagline: "让简历制作变得简单",
    color: "from-blue-500 via-indigo-500 to-purple-500"
  };

  const features = [
    {
      title: "智能排版",
      description: "AI辅助排版，告别繁琐调整",
      highlight: "3倍效率",
      icon: Layout,
      color: "from-blue-600 to-blue-400"
    },
    {
      title: "专业模板",
      description: "精选行业模板，一键应用",
      highlight: "100+ 模板",
      icon: Layers,
      color: "from-violet-600 to-violet-400"
    },
    {
      title: "数据安全",
      description: "本地存储，安全可靠",
      highlight: "隐私优先",
      icon: Shield,
      color: "from-emerald-600 to-emerald-400"
    },
    {
      title: "多端同步",
      description: "随时随地，无缝编辑",
      highlight: "云端同步",
      icon: Cloud,
      color: "from-orange-600 to-orange-400"
    }
  ];

  // 品牌核心卡片组件
  const BrandCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="relative col-span-2 row-span-2"
    >
      <div
        className={cn(
          "h-full w-full rounded-3xl overflow-hidden",
          "border backdrop-blur-xl",
          "dark:bg-black/40 dark:border-white/10 bg-white/40 border-black/5"
        )}
      >
        {/* 渐变背景 */}
        <div className="absolute inset-0 opacity-10">
          <div
            className={cn(
              "w-full h-full bg-gradient-to-br",
              brandFeature.color
            )}
          />
        </div>

        {/* 光效装饰 */}
        <div className="absolute inset-0">
          <div
            className={cn(
              "w-1/2 h-1/2 rounded-full blur-3xl",
              "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
              "transform -translate-x-1/4 -translate-y-1/4"
            )}
          />
        </div>

        {/* 内容 */}
        <div className="relative h-full p-8 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2
              className={cn(
                "text-4xl md:text-5xl font-bold mb-4",
                "bg-gradient-to-r bg-clip-text text-transparent",
                brandFeature.color
              )}
            >
              {brandFeature.title}
            </h2>
            <p className="text-xl md:text-2xl font-medium mb-6">
              {brandFeature.subtitle}
            </p>
            <p className={cn("text-base", "text-gray-600 dark:text-gray-400")}>
              {brandFeature.tagline}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // 功能卡片组件
  const FeatureCard = ({ feature, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 * (index + 1),
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="group"
    >
      <div
        className={cn(
          "h-full rounded-3xl overflow-hidden",
          "border backdrop-blur-xl transition-all duration-500",
          "dark:bg-black/40 dark:border-white/10 bg-white/40 border-black/5 dark:hover:border-white/20 hover:border-black/10"
        )}
      >
        <div className="relative h-full p-6">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
            <div
              className={cn("w-full h-full bg-gradient-to-br", feature.color)}
            />
          </div>

          {/* 内容 */}
          <div className="relative h-full flex flex-col">
            {/* 图标 */}
            <div
              className={cn(
                "w-12 h-12 rounded-2xl mb-4",
                "bg-gradient-to-br flex items-center justify-center",
                "transform transition-transform duration-500",
                "group-hover:scale-110 group-hover:rotate-3",
                feature.color
              )}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </div>

            {/* 文本 */}
            <h3 className="text-xl font-bold mb-2 transition-colors duration-300">
              {feature.title}
            </h3>
            <p
              className={cn("text-sm mb-4", "text-gray-600 dark:text-gray-400")}
            >
              {feature.description}
            </p>

            {/* 高亮标签 */}
            <div className="mt-auto">
              <span
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-sm",
                  "transition-all duration-500",
                  "bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                )}
              >
                {feature.highlight}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {/* 品牌核心展示 */}
        <BrandCard />

        {/* 功能特性 */}
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </div>
  );
};

// 主页面组件
export default function LandingPage() {
  return (
    <div className="min-h-screen relative  dark:bg-black dark:text-white bg-gray-50 text-gray-900">
      <ScrollToTop />

      {/* Header */}
      <header
        className="fixed top-0 w-full border-b backdrop-blur-md z-40 transition-colors duration-300
        dark:border-white/5 dark:bg-black/50 border-gray-200 bg-white/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Magic Resume
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle></ThemeToggle>
            <EditButton className="bg-primary text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors flex items-center space-x-1">
              <span>开始制作</span>
              <ChevronRight className="h-4 w-4" />
            </EditButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
            极致简历定制体验
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              尽在掌控
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            <TypewriterText text="每一处细节，都由你掌控。打造真正与众不同的个人简历。" />
          </p>

          <EditButton className="mt-8 bg-primary text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors">
            <span>开始定制</span>
            <ChevronRight className="h-4 w-4" />
          </EditButton>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 relative">
            <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm">
              <div className="flex items-center justify-center h-full">
                <div className="w-3/4 h-3/4 rounded-lg border border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="p-8 flex justify-between">
                    <div className="w-1/3 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-8 bg-white/10 rounded animate-pulse"
                        />
                      ))}
                    </div>
                    <div className="w-2/3 ml-8 space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-4 bg-white/5 rounded animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-24"
          >
            全方位的功能支持
          </motion.h2>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* 背景装饰 */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 
                rounded-3xl blur-3xl transition-opacity duration-500
                dark:opacity-30 opacity-10"
              />
            </motion.div>

            {/* 功能网格 */}
            <FeatureGrid />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold mb-8">开启你的个性化简历之旅</h2>
            <EditButton
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              立即开始定制
              <ArrowRight className="ml-2 h-4 w-4" />
            </EditButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 border-t dark:border-white/5 border-gray-200`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Magic Resume. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="#"
                className="text-sm dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                隐私政策
              </a>
              <a
                href="#"
                className="text-sm dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                使用条款
              </a>
              <a
                href="#"
                className="text-sm dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                联系我们
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 移动端菜单按钮 */}
      <div className="fixed bottom-6 right-6 md:hidden space-y-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 rounded-full shadow-lg dark:bg-white/10 bg-white backdrop-blur-sm"
        >
          <ArrowRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
}
