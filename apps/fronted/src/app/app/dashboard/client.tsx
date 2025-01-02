"use client";
import { useEffect, useState } from "react";
import { FileText, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/components/shared/Logo";
import { useTranslations } from "next-intl";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("dashboard");
  const sidebarItems = [
    {
      title: t("sidebar.resumes"),
      url: "/app/dashboard/resumes",
      icon: FileText,
    },
    {
      title: t("sidebar.settings"),
      url: "/app/dashboard/settings",
      icon: Settings,
    },
  ];

  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">(
    "icon"
  );

  useEffect(() => {
    if (pathname.includes("/workbench")) {
      setOpen(false);
      return;
    }
  }, [pathname]);

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar collapsible={collapsible}>
          <SidebarHeader>
            <div className="w-full   justify-center  flex">
              <Logo
                className="cursor-pointer"
                size={40}
                onClick={() => router.push("/")}
              />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <TooltipProvider delayDuration={300} key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuItem key={item.title} title={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={item.url === pathname}
                            >
                              <div
                                className="flex items-center gap-2 p-[8px]"
                                onClick={() => {
                                  router.push(item.url);
                                }}
                              >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {open && <span>{item.title}</span>}
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </TooltipTrigger>
                        {!open && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
