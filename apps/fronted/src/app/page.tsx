"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  FileText,
  Sun,
  Moon,
  Layout,
  Brush,
  Download,
  Share2,
  Grid,
  Layers,
  Palette,
  Settings
} from "lucide-react";
import ScrollToTop from "../components/ScrollToTop";

const features = [
  {
    icon: <Layout className="h-6 w-6" />,
    title: "自由布局",
    description: "灵活的模块拖拽，随心所欲地调整简历版面布局"
  },
  {
    icon: <Brush className="h-6 w-6" />,
    title: "样式定制",
    description: "字体、颜色、间距等细节完全可调，打造独特简历风格"
  },
  {
    icon: <Grid className="h-6 w-6" />,
    title: "模块定制",
    description: "自定义模块内容与顺序，突出个人优势特点"
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: "主题定制",
    description: "提供多套配色方案，也可以自定义专属配色"
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "内容模板",
    description: "丰富的内容模板，帮助你更好地展示经历"
  },
  {
    icon: <Settings className="h-6 w-6" />,
    title: "一键调整",
    description: "快速调整字号、间距等，适配不同场景需求"
  }
];

const stats = [
  { number: "95%", label: "定制程度", icon: Layout },
  { number: "100+", label: "组件模块", icon: Grid },
  { number: "50+", label: "预设主题", icon: Palette },
  { number: "24H", label: "客服响应", icon: Share2 }
];

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = window?.localStorage?.getItem("theme");
    const prefersDark = window?.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;

    const theme = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDark(theme);

    if (theme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    window?.localStorage?.setItem("theme", newTheme ? "dark" : "light");
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
        ); // 添加随机延迟使打字效果更自然
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

  return (
    <div
      className={`min-h-screen relative ${isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <ScrollToTop />

      {/* Header */}
      <header
        className={`fixed top-0 w-full border-b backdrop-blur-md z-40 transition-colors duration-300
        ${isDark ? "border-white/5 bg-black/50" : "border-gray-200 bg-white/50"}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Magic Resume
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button>
              立即使用
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
            <TypewriterText text="每一处细节，都由你掌控。打造真正与众不同的个人简历。"></TypewriterText>
          </p>
          <Button size="lg" className="mt-8">
            开始定制
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 relative">
            <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm">
              <div className="flex items-center justify-center h-full">
                <div className="w-3/4 h-3/4 rounded-lg border border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
                  {/* 编辑器界面模拟 */}
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

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-block p-4 rounded-lg bg-blue-500/10 mb-4">
                  <stat.icon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.number}</div>
                <div className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            让简历制作变得简单
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className={`group cursor-pointer transition-all duration-300 
                ${isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "hover:shadow-lg"}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">开启你的个性化简历之旅</h2>
          <Button size="lg">
            立即开始定制
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
