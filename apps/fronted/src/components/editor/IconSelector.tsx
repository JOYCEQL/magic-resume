import React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  // 个人信息相关
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Smartphone,
  // 教育背景相关
  GraduationCap,
  School,
  Book,
  Library,
  Award,
  // 工作经验相关
  Briefcase,
  Building2,
  Building,
  CalendarRange,
  Clock,
  // 技能相关
  Code,
  Cpu,
  Database,
  Terminal,
  Layers,
  // 语言相关
  Languages,
  MessageSquare,
  MessagesSquare,
  // 项目相关
  FolderGit2,
  GitBranch,
  Rocket,
  Target,
  // 成就与证书
  Trophy,
  Medal,
  Star,
  // 兴趣爱好
  Heart,
  Music,
  Palette,
  Camera,
  // 社交媒体
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  // 其他常用
  FileText,
  FileCheck,
  Filter,
  Link,
  Wallet,
  Lightbulb,
  Send,
  Share2,
  Settings,
  Search as SearchIcon,
  Flag,
  Bookmark,
  ThumbsUp,
  Zap
} from "lucide-react";

interface IconOption {
  label: string;
  value: string;
  icon: React.ElementType;
  category: string;
}

interface IconSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  theme?: "light" | "dark";
}

const iconOptions: IconOption[] = [
  // 个人信息类
  { label: "用户", value: "User", icon: User, category: "个人信息" },
  { label: "邮箱", value: "Mail", icon: Mail, category: "个人信息" },
  { label: "电话", value: "Phone", icon: Phone, category: "个人信息" },
  { label: "地址", value: "MapPin", icon: MapPin, category: "个人信息" },
  { label: "网站", value: "Globe", icon: Globe, category: "个人信息" },
  {
    label: "手机",
    value: "Smartphone",
    icon: Smartphone,
    category: "个人信息"
  },

  // 教育背景类
  {
    label: "学历",
    value: "GraduationCap",
    icon: GraduationCap,
    category: "教育背景"
  },
  { label: "学校", value: "School", icon: School, category: "教育背景" },
  { label: "专业", value: "Book", icon: Book, category: "教育背景" },
  { label: "图书馆", value: "Library", icon: Library, category: "教育背景" },
  { label: "奖学金", value: "Award", icon: Award, category: "教育背景" },

  // 工作经验类
  { label: "工作", value: "Briefcase", icon: Briefcase, category: "工作经验" },
  { label: "公司", value: "Building2", icon: Building2, category: "工作经验" },
  { label: "办公室", value: "Building", icon: Building, category: "工作经验" },
  {
    label: "日期范围",
    value: "CalendarRange",
    icon: CalendarRange,
    category: "工作经验"
  },
  { label: "工作时间", value: "Clock", icon: Clock, category: "工作经验" },

  // 技能类
  { label: "编程", value: "Code", icon: Code, category: "技能" },
  { label: "系统", value: "Cpu", icon: Cpu, category: "技能" },
  { label: "数据库", value: "Database", icon: Database, category: "技能" },
  { label: "终端", value: "Terminal", icon: Terminal, category: "技能" },
  { label: "技术栈", value: "Layers", icon: Layers, category: "技能" },

  // 语言类
  { label: "语言", value: "Languages", icon: Languages, category: "语言" },
  {
    label: "口语",
    value: "MessageSquare",
    icon: MessageSquare,
    category: "语言"
  },
  {
    label: "交流",
    value: "MessagesSquare",
    icon: MessagesSquare,
    category: "语言"
  },

  // 项目经验类
  { label: "项目", value: "FolderGit2", icon: FolderGit2, category: "项目" },
  { label: "分支", value: "GitBranch", icon: GitBranch, category: "项目" },
  { label: "发布", value: "Rocket", icon: Rocket, category: "项目" },
  { label: "目标", value: "Target", icon: Target, category: "项目" },

  // 成就与证书类
  { label: "奖杯", value: "Trophy", icon: Trophy, category: "成就证书" },
  { label: "奖牌", value: "Medal", icon: Medal, category: "成就证书" },
  { label: "星级", value: "Star", icon: Star, category: "成就证书" },

  // 兴趣爱好类
  { label: "兴趣", value: "Heart", icon: Heart, category: "兴趣爱好" },
  { label: "音乐", value: "Music", icon: Music, category: "兴趣爱好" },
  { label: "艺术", value: "Palette", icon: Palette, category: "兴趣爱好" },
  { label: "摄影", value: "Camera", icon: Camera, category: "兴趣爱好" },

  // 社交媒体类
  { label: "Github", value: "Github", icon: Github, category: "社交媒体" },
  { label: "领英", value: "Linkedin", icon: Linkedin, category: "社交媒体" },
  { label: "推特", value: "Twitter", icon: Twitter, category: "社交媒体" },
  { label: "脸书", value: "Facebook", icon: Facebook, category: "社交媒体" },
  { label: "照片", value: "Instagram", icon: Instagram, category: "社交媒体" },

  // 其他类
  { label: "简介", value: "FileText", icon: FileText, category: "其他" },
  { label: "审核", value: "FileCheck", icon: FileCheck, category: "其他" },
  { label: "筛选", value: "Filter", icon: Filter, category: "其他" },
  { label: "链接", value: "Link", icon: Link, category: "其他" },
  { label: "薪资", value: "Wallet", icon: Wallet, category: "其他" },
  { label: "创意", value: "Lightbulb", icon: Lightbulb, category: "其他" },
  { label: "发送", value: "Send", icon: Send, category: "其他" },
  { label: "分享", value: "Share2", icon: Share2, category: "其他" },
  { label: "设置", value: "Settings", icon: Settings, category: "其他" },
  { label: "搜索", value: "SearchIcon", icon: SearchIcon, category: "其他" },
  { label: "标记", value: "Flag", icon: Flag, category: "其他" },
  { label: "收藏", value: "Bookmark", icon: Bookmark, category: "其他" },
  { label: "点赞", value: "ThumbsUp", icon: ThumbsUp, category: "其他" },
  { label: "技能", value: "Zap", icon: Zap, category: "其他" }
];

const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  theme = "light"
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isHovered, setIsHovered] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("全部");

  const selectedIcon =
    iconOptions.find((i) => i.value === value) || iconOptions[0];
  const Icon = selectedIcon.icon;

  const categories = [
    "全部",
    ...Array.from(new Set(iconOptions.map((icon) => icon.category)))
  ];

  const filteredIcons = iconOptions.filter((icon) => {
    const matchesSearch =
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "全部" || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (iconValue: string) => {
    onChange(iconValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-8 h-8 p-2 rounded-md relative overflow-hidden",
            "transform-gpu transition-all duration-300 ease-out",
            theme === "dark"
              ? "bg-neutral-800 hover:bg-neutral-700/90"
              : "bg-white hover:bg-neutral-50/90 "
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4 transform-gpu transition-transform duration-300",
              "hover:rotate-[360deg]",
              theme === "dark" ? "text-neutral-200" : "text-neutral-700"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[420px] p-4",
          theme === "dark"
            ? "bg-neutral-900 border-neutral-800"
            : "bg-white border-neutral-200",
          "shadow-lg backdrop-blur-sm",
          "animate-in zoom-in-95 duration-200"
        )}
      >
        <div className="space-y-3">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              "transform-gpu transition-all duration-300",
              theme === "dark"
                ? "bg-neutral-800/50 border border-neutral-700"
                : "bg-neutral-50 border border-neutral-200",
              "focus-within:ring-2",
              theme === "dark"
                ? "focus-within:ring-blue-500/30"
                : "focus-within:ring-blue-500/20"
            )}
          >
            <Search
              className={cn(
                "w-4 h-4 transition-colors duration-300",
                theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              )}
            />
            <input
              type="text"
              placeholder="搜索图标..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full bg-transparent border-none outline-none text-sm",
                "transition-colors duration-300",
                theme === "dark" ? "text-neutral-200" : "text-neutral-700",
                "placeholder:text-neutral-500",
                "focus:ring-0"
              )}
            />
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  "transition-all duration-200",
                  selectedCategory === category
                    ? theme === "dark"
                      ? "bg-neutral-800 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20"
                    : theme === "dark"
                      ? "text-neutral-400 hover:text-neutral-200"
                      : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-2 max-h-[400px] overflow-x-hidden overflow-y-auto pr-2">
            {filteredIcons.map(({ value: iconValue, icon: Icon, label }) => (
              <Button
                key={iconValue}
                variant="ghost"
                onMouseEnter={() => setIsHovered(iconValue)}
                onMouseLeave={() => setIsHovered("")}
                onClick={() => handleSelect(iconValue)}
                className={cn(
                  "relative p-2 h-10 rounded-lg group",
                  theme === "dark"
                    ? "hover:bg-neutral-800/70 text-neutral-300 hover:text-neutral-200"
                    : "hover:bg-neutral-100/70 text-neutral-600 hover:text-neutral-900",
                  value === iconValue &&
                    (theme === "dark"
                      ? "bg-neutral-800 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20")
                )}
              >
                <Icon className={cn("w-4 h-4")} />
                <span
                  className={cn(
                    "absolute -top-9 left-1/2 -translate-x-1/2",
                    "px-2 py-1 text-xs rounded-md",
                    "opacity-0 translate-y-1",
                    "group-hover:opacity-100 group-hover:translate-y-0",
                    "pointer-events-none",

                    theme === "dark"
                      ? "bg-neutral-800 text-neutral-200 border border-neutral-700"
                      : "bg-white text-neutral-700 border border-neutral-200",
                    "shadow-sm whitespace-nowrap z-10"
                  )}
                >
                  {label}
                </span>
                {isHovered === iconValue && (
                  <span
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r",
                      theme === "dark"
                        ? "from-blue-500/10 to-purple-500/10"
                        : "from-blue-500/5 to-purple-500/5",
                      "animate-in fade-in duration-300"
                    )}
                  />
                )}
              </Button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div
              className={cn(
                "flex flex-col items-center justify-center py-8 px-4",
                "text-sm",
                theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              )}
            >
              <SearchIcon className="w-12 h-12 mb-2 opacity-20" />
              <p>未找到匹配的图标</p>
              <p className="text-xs opacity-70">
                {searchTerm ? "请尝试其他搜索关键词" : "请选择其他分类"}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconSelector;
