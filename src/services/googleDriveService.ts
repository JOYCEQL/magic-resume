"use client";

import { toast } from "sonner";
import { ResumeData } from "@/types/resume";

// Google OAuth 2.0配置
const CLIENT_ID =
  "445155762398-erm62c9ckr2fjhi1kbq5ano91u75uldb.apps.googleusercontent.com";
const REDIRECT_URI =
  typeof window !== "undefined" ? `${window.location.origin}/app` : "";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// 获取授权URL
export const getAuthUrl = (): string => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", CLIENT_ID);
  url.searchParams.append("redirect_uri", REDIRECT_URI);
  url.searchParams.append("response_type", "token");
  url.searchParams.append("scope", SCOPES.join(" "));
  return url.toString();
};

// 从URL中获取访问令牌
export const getAccessTokenFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("access_token");
};

// 检查是否已登录
export const isSignedIn = (): boolean => {
  const token = localStorage.getItem("google_access_token");
  return !!token;
};

// 登录Google账户
export const signIn = async (): Promise<void> => {
  try {
    window.location.href = getAuthUrl();
  } catch (error) {
    console.error("Error signing in:", error);
    toast.error("登录Google账户失败");
    throw error;
  }
};

// 登出Google账户
export const signOut = (): void => {
  try {
    localStorage.removeItem("google_access_token");
    toast.success("已退出Google账户");
  } catch (error) {
    console.error("Error signing out:", error);
    toast.error("退出Google账户失败");
    throw error;
  }
};

// 上传简历数据到Google Drive
export const uploadResumeToDrive = async (
  resume: ResumeData
): Promise<string> => {
  try {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      throw new Error("用户未登录Google账户");
    }

    const fileName = `${resume.title}.json`;
    const fileContent = JSON.stringify(resume, null, 2);
    const file = new Blob([fileContent], { type: "application/json" });

    // 检查是否已存在同名文件
    const existingFileId = await findResumeFile(fileName);

    try {
      if (existingFileId) {
        // 更新现有文件
        const form = new FormData();
        form.append("file", file);

        const response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: file
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "更新文件失败");
        }
        toast.success(`简历已更新到Google Drive: ${fileName}`);
        return existingFileId;
      } else {
        // 创建新文件
        const metadata = {
          name: fileName,
          mimeType: "application/json"
        };

        const form = new FormData();
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
          delimiter +
          "Content-Type: application/json\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: application/json\r\n\r\n" +
          fileContent +
          closeDelim;

        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": `multipart/related; boundary=${boundary}`
            },
            body: multipartRequestBody
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "创建文件失败");
        }
        const data = await response.json();
        toast.success(`简历已保存到Google Drive: ${fileName}`);
        return data.id;
      }
    } catch (apiError: any) {
      if (apiError.message.includes("API has not been used")) {
        toast.error("请先在Google Cloud Console中启用Google Drive API");
        window.open(
          "https://console.developers.google.com/apis/api/drive.googleapis.com/overview",
          "_blank"
        );
      }
      throw apiError;
    }
  } catch (error) {
    console.error("Error uploading resume to Google Drive:", error);
    toast.error("保存简历到Google Drive失败");
    throw error;
  }
};

// 从Google Drive下载简历数据
export const downloadResumeFromDrive = async (
  fileId: string
): Promise<ResumeData> => {
  try {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      throw new Error("用户未登录Google账户");
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) throw new Error("下载文件失败");
    const resumeData = (await response.json()) as ResumeData;
    toast.success("已从Google Drive加载简历");
    return resumeData;
  } catch (error) {
    console.error("Error downloading resume from Google Drive:", error);
    toast.error("从Google Drive加载简历失败");
    throw error;
  }
};

// 获取用户Google Drive中的所有简历文件
export const listResumeFiles = async (): Promise<
  Array<{ id: string; name: string }>
> => {
  try {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      throw new Error("用户未登录Google账户");
    }

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/json" and name contains ".json"&fields=files(id,name)',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) throw new Error("获取文件列表失败");
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("Error listing resume files from Google Drive:", error);
    toast.error("获取Google Drive简历列表失败");
    throw error;
  }
};

// 查找特定名称的简历文件
const findResumeFile = async (fileName: string): Promise<string | null> => {
  try {
    const token = localStorage.getItem("google_access_token");
    if (!token) return null;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) throw new Error("查找文件失败");
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  } catch (error) {
    console.error("Error finding resume file:", error);
    return null;
  }
};

// 删除Google Drive中的简历文件
export const deleteResumeFromDrive = async (fileId: string): Promise<void> => {
  try {
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      throw new Error("用户未登录Google账户");
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) throw new Error("删除文件失败");
    toast.success("已从Google Drive删除简历");
  } catch (error) {
    console.error("Error deleting resume from Google Drive:", error);
    toast.error("从Google Drive删除简历失败");
    throw error;
  }
};
