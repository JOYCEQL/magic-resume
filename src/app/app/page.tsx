"use client";

import { useEffect } from "react";
import GoogleAuthCallback from "@/components/shared/GoogleAuthCallback";
import { useRouter } from "next/navigation";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    // 检查URL是否包含授权回调参数
    const hasAuthCallback = window.location.hash.includes("access_token");
    if (!hasAuthCallback) {
      // 检查是否已登录
      const token = localStorage.getItem("google_access_token");
      if (!token) {
        router.push("/");
      }
    }
  }, [router]);

  // 如果URL包含授权回调参数，显示回调处理组件
  if (
    typeof window !== "undefined" &&
    window.location.hash.includes("access_token")
  ) {
    return <GoogleAuthCallback />;
  }

  // 正常显示应用内容
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">我的简历</h1>
      {/* 这里添加应用的主要内容 */}
    </div>
  );
}
