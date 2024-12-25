import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Header from "@/components/home/Header";
import { HeroAnimation } from "@/components/home/HeroAnimation";
import { FeaturesAnimation } from "@/components/home/FeaturesAnimation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-6">
            <HeroAnimation>
              <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                开源免费，隐私优先
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
                无需注册登录，数据完全存储在本地。
              </p>
              <div className="mt-12">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="rounded-full px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    立即创建简历
                  </Button>
                </Link>
              </div>
            </HeroAnimation>

            <div className="mt-16 relative rounded-2xl overflow-hidden bg-white">
              <Image
                width={1280}
                height={720}
                src="/web-shot.png"
                alt="resume-shot"
                className="w-full h-auto block border-[1px] border-gray-200"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <FeaturesAnimation index={0}>
            <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
              <div className="flex-1 order-2 md:order-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      AI 智能纠错
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">智能识别，专业建议</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    内置智能语法检查，自动识别不恰当的表达，
                    提供专业的修改建议，让您的简历更加出色。
                  </p>
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/ai-correction.svg"
                    width={600}
                    height={400}
                    alt="AI 智能纠错演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </FeaturesAnimation>

          <FeaturesAnimation index={1}>
            <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
              <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/local-storage.svg"
                    width={600}
                    height={400}
                    alt="本地存储演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      本地存储
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">数据安全，隐私优先</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    所有简历数据完全存储在您的本地设备中，无需担心隐私泄露。
                    支持数据导出备份，确保您的简历数据随时可用。无需注册登录，
                    即可享受所有功能。
                  </p>
                </div>
              </div>
            </div>
          </FeaturesAnimation>

          <FeaturesAnimation index={2}>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 order-2 md:order-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      实时预览
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">所见即所得</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    边编辑边预览，实时查看简历效果。支持多种专业模板，
                    让您的简历既美观又规范。快速导出PDF，随时投递简历。
                  </p>
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/real-time-preview.svg"
                    width={600}
                    height={400}
                    alt="实时预览演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </FeaturesAnimation>
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
