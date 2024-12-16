import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Header from "@/components/home/Header";
import { HeroAnimation } from "@/components/home/HeroAnimation";
import { FeaturesAnimation } from "@/components/home/FeaturesAnimation";

const features = [
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
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-6">
            <HeroAnimation>
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                专注内容，隐私优先
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                数据完全存储在本地，确保您的隐私安全。
              </p>
              <div className="mt-8">
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-[10px] px-8">
                    立即创建简历
                  </Button>
                </Link>
              </div>
            </HeroAnimation>

            <div className="mt-16 relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-blue-500/10 rounded-2xl" />
              <Image
                width={1280}
                height={720}
                src="/web-shot.png"
                alt="resume-shot"
                className="w-full h-auto relative z-10 rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeaturesAnimation key={feature.title} index={index}>
                <div className="relative p-6 rounded-2xl bg-card border group hover:shadow-lg transition-shadow duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-violet-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  <div className="relative">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </FeaturesAnimation>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>&#169; 2024 Magic Resume. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
