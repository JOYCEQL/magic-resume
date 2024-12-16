"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed w-full z-50 flex justify-center">
        <motion.div
          className="w-[90%] max-w-5xl"
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: isVisible ? 0 : -100,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <div className="mt-4 rounded-full bg-background/70 backdrop-blur-[8px] border border-border/50">
            <div className="relative flex items-center justify-between h-12 px-6">
              <div className="flex items-center space-x-2">
                <Logo size={32} />
                <span className="font-bold text-base">Magic Resume</span>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle>
                  <div className="w-8 h-8 relative cursor-pointer rounded-md hover:bg-accent/50 flex items-center justify-center">
                    <Sun className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                </ThemeToggle>
                <Link href="/dashboard">
                  <Button
                    variant="default"
                    className="bg-primary hover:opacity-90 text-white h-8 text-sm rounded-full px-4"
                  >
                    开始使用
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              专注内容，隐私优先
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              数据完全存储在本地，确保您的隐私安全。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="rounded-[10px] px-8">
                  立即创建简历
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-16 relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-blue-500/10 rounded-2xl" />
            <Image
              width={1280}
              height={720}
              src="/web-shot.png"
              alt="resume-shot"
              className="w-full h-auto relative z-10 rounded-2xl shadow-2xl"
              priority
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "简约设计",
                description: "专注于内容创作，简洁的界面让您的思路更加清晰",
                icon: "✨",
              },
              {
                title: "本地存储",
                description: "所有数据存储在本地，无需担心隐私泄露",
                icon: "🔒",
              },
              {
                title: "智能助手",
                description: "AI助手帮您优化简历内容，提供专业建议",
                icon: "🤖",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="relative p-6 rounded-2xl bg-card border group hover:shadow-lg transition-shadow duration-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-violet-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="relative">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p> 2024 Magic Resume. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
