"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function GoogleAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // 从URL hash中提取access_token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (accessToken) {
      // 保存token到localStorage
      localStorage.setItem("google_access_token", accessToken);
      toast.success("Google账户登录成功");

      // 清除URL中的hash并重定向到应用主页
      window.location.hash = "";
      router.push("/app");
    } else {
      toast.error("Google授权失败");
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">正在处理Google授权...</h2>
        <p className="text-gray-600">请稍候，马上就好</p>
      </div>
    </div>
  );
}