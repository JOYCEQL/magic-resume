import React from "react";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import ScrollToTop from "../components/shared/ScrollToTop";
import EditButton from "@/components/shared/EditButton";
import dynamic from "next/dynamic";
import CreateResume from "@/components/home/CreateResume";
const AnimatedHero = dynamic(() => import("@/components/home/AnimatedHero"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
    </div>
  ),
});

const AnimatedFeatures = dynamic(
  () => import("@/components/home/AnimatedFeatures"),
  {
    ssr: false,
  }
);

export const metadata = {
  title: "Magic Resume - AI驱动的智能简历系统",
  description:
    "使用AI技术，让简历制作变得简单。提供智能排版、专业模板、数据安全、多端同步等功能。",
  keywords: "简历制作,AI简历,智能简历,在线简历",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen relative dark:bg-black dark:text-white bg-[#fafafa] text-gray-900">
      <ScrollToTop />

      {/* Header */}
      <header
        className="fixed top-0 w-full border-b backdrop-blur-xl z-40 transition-colors duration-300
        dark:border-white/5 dark:bg-black/50 border-gray-200 bg-white/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text">
              Magic Resume
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <EditButton className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center space-x-2">
              <span>开始制作</span>
              <ChevronRight className="h-4 w-4" />
            </EditButton>
          </div>
        </div>
      </header>

      {/* <AnimatedHero /> */}

      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:40px_40px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-tr from-blue-500/30 to-violet-500/30 dark:from-blue-500/10 dark:to-violet-500/10 blur-3xl opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text inline-block">
              AI智能简历新体验
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              告别繁琐的简历制作流程，让AI助手帮你完成专业简历
            </p>

            {/* <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-lg shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                <input
                  type="text"
                  placeholder="例如：'我是一名3年经验的前端开发工程师，擅长React和TypeScript...'"
                  className="flex-1 px-6 py-4 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
                />
                <CreateResume></CreateResume>
              </div>
            </div> */}
          </div>

          <div className="relative mt-20">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30" />
              <Image
                width={1280}
                height={960}
                src="/web-shot.png"
                alt="resume-shot"
                className="w-full h-auto transform hover:scale-[1.02] transition-transform duration-500"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      <AnimatedFeatures />

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px]" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-20" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-violet-500 to-transparent opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="space-y-8">
            <EditButton
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-full hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 text-lg"
            >
              免费开始使用
              <ArrowRight className="ml-2 h-5 w-5" />
            </EditButton>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t dark:border-white/5 border-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              {new Date().getFullYear()} Magic Resume. All rights reserved.
            </div>
            <div className="flex items-center space-x-8">
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                隐私政策
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                使用条款
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                联系我们
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
