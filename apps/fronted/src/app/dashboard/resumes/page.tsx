"use client";
import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
const ResumesList = () => {
  return <ResumeWorkbench />;
};

const ResumeWorkbench = () => {
  const {
    resumes,
    createResume,
    deleteResume,
    setActiveResume,
    updateResume,
    updateResumeFromFile,
  } = useResumeStore();
  const router = useRouter();

  useEffect(() => {
    const syncResumesFromFiles = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        if (!handle) return;

        const hasPermission = await verifyPermission(handle);
        if (!hasPermission) return;

        const dirHandle = handle as FileSystemDirectoryHandle;

        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            try {
              const file = await entry.getFile();
              const content = await file.text();
              const resumeData = JSON.parse(content);
              updateResumeFromFile(resumeData);
            } catch (error) {
              console.error("Error reading resume file:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error syncing resumes from files:", error);
      }
    };

    if (Object.keys(resumes).length === 0) {
      syncResumesFromFiles();
    }
  }, [resumes, updateResume]);

  const handleCreateResume = () => {
    const newId = createResume(null);
    setActiveResume(newId);
  };

  return (
    <>
      <div className="h-[60px] border-b px-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">我的简历</h1>
        <Button onClick={handleCreateResume}>
          <Plus className="mr-2 h-4 w-4" />
          新建简历
        </Button>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed hover:border-primary/50 cursor-pointer">
            <CardContent
              className="pt-6 text-center"
              onClick={handleCreateResume}
            >
              <div className="mb-4 w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Plus className="text-primary" size={24} />
              </div>
              <CardTitle className="text-lg mb-2">创建新简历</CardTitle>
              <CardDescription>从头开始创建一份新的简历</CardDescription>
            </CardContent>
          </Card>

          {Object.entries(resumes).map(([id, resume]) => (
            <Card key={id}>
              <CardHeader>
                <CardTitle>{resume.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  创建于 {new Date(resume.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardContent>
              <CardFooter className="gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setActiveResume(id);
                    router.push(`/workbench/${id}`);
                  }}
                >
                  编辑
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => deleteResume(resume)}
                >
                  删除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default ResumesList;
