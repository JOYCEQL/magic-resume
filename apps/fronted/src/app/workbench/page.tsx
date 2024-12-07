"use client";
import React, { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, List, FileText, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const sidebarItems = [
  {
    title: "简历",
    url: "/workbench",
    icon: FileText,
  },
  {
    title: "设置",
    url: "#",
    icon: Settings,
  },
];

const ResumeWorkbench = () => {
  const { resumes, createResume, deleteResume } = useResumeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { setActiveResume } = useResumeStore();
  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="p-4">
              <h2 className="text-xl font-semibold">Magic Resume</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>导航</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === pathname}
                      >
                        <a href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex ">
          <div className="flex-1">
            <header className="border-b p-4 flex justify-between items-center">
              <div className="flex">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold">简历</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid size={20} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List size={20} />
                </Button>
              </div>
            </header>

            <div className="flex-1 p-6 overflow-auto">
              <div
                className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}
              >
                <Card className="border-dashed hover:border-primary/50 cursor-pointer">
                  <CardContent
                    className="pt-6 text-center"
                    onClick={() => createResume(null)}
                  >
                    <div className="mb-4 w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <Plus className="text-primary" size={24} />
                    </div>
                    <CardTitle className="text-lg mb-2">创建新简历</CardTitle>
                    <CardDescription>从头开始创建</CardDescription>
                  </CardContent>
                </Card>

                {Object.entries(resumes).map(([id, resume]) => (
                  <Card key={id} className="group">
                    <CardHeader>
                      <CardTitle>{resume.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        最后修改: {resume.updatedAt}
                      </p>
                    </CardContent>
                    <CardFooter className="opacity-0 group-hover:opacity-100 transition-opacity gap-2">
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
                        variant="destructive"
                        className="flex-1"
                        onClick={() => deleteResume(id)}
                      >
                        删除
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default ResumeWorkbench;
