"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useResumeStore } from "@/store/useResumeStore";
import * as GoogleDriveService from "@/services/googleDriveService";

const GoogleDriveIntegration = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [showFilesDialog, setShowFilesDialog] = useState(false);

  const { activeResume, updateResumeFromFile, addResume } = useResumeStore();
  const t = useTranslations("googleDrive");

  // 检查登录状态
  useEffect(() => {
    const checkSignInStatus = async () => {
      try {
        const signedIn = await GoogleDriveService.isSignedIn();
        setIsSignedIn(signedIn);
      } catch (error) {
        console.error("Error checking sign-in status:", error);
      }
    };

    checkSignInStatus();
  }, []);

  // 处理登录
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await GoogleDriveService.signIn();
      setIsSignedIn(true);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登出
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await GoogleDriveService.signOut();
      setIsSignedIn(false);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 上传当前简历到Google Drive
  const handleUploadResume = async () => {
    if (!activeResume) {
      toast.error(t("noActiveResume"));
      return;
    }

    setIsLoading(true);
    try {
      await GoogleDriveService.uploadResumeToDrive(activeResume);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取Google Drive中的简历文件列表
  const handleListResumeFiles = async () => {
    setIsLoading(true);
    try {
      const files = await GoogleDriveService.listResumeFiles();
      setResumeFiles(files);
      setShowFilesDialog(true);
    } catch (error) {
      console.error("List files error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 从Google Drive下载简历
  const handleDownloadResume = async (fileId: string, fileName: string) => {
    setIsLoading(true);
    try {
      const resumeData = await GoogleDriveService.downloadResumeFromDrive(
        fileId
      );

      // 检查是否已存在相同ID的简历
      const existingResume = Object.values(
        useResumeStore.getState().resumes
      ).find((resume) => resume.id === resumeData.id);

      if (existingResume) {
        // 更新现有简历
        updateResumeFromFile(resumeData);
        toast.success(t("resumeUpdated", { name: resumeData.title }));
      } else {
        // 添加新简历
        addResume(resumeData);
        toast.success(t("resumeImported", { name: resumeData.title }));
      }

      setShowFilesDialog(false);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isSignedIn ? (
            <DropdownMenuItem onClick={handleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              {t("signIn")}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={handleUploadResume}>
                <Upload className="mr-2 h-4 w-4" />
                {t("uploadResume")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleListResumeFiles}>
                <Download className="mr-2 h-4 w-4" />
                {t("downloadResumes")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("signOut")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("resumeFiles")}</DialogTitle>
            <DialogDescription>{t("selectResumeToDownload")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {resumeFiles.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                {t("noResumesFound")}
              </p>
            ) : (
              <ul className="space-y-2">
                {resumeFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex justify-between items-center p-2 border rounded hover:bg-accent"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadResume(file.id, file.name)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleDriveIntegration;
