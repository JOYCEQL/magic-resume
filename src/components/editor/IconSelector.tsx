import React from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  Zap,
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
}

const getIconOptions = (t: any): IconOption[] => [
  // 个人信息类
  {
    label: t("icons.user"),
    value: "User",
    icon: User,
    category: t("categories.personal"),
  },
  {
    label: t("icons.email"),
    value: "Mail",
    icon: Mail,
    category: t("categories.personal"),
  },
  {
    label: t("icons.phone"),
    value: "Phone",
    icon: Phone,
    category: t("categories.personal"),
  },
  {
    label: t("icons.address"),
    value: "MapPin",
    icon: MapPin,
    category: t("categories.personal"),
  },
  {
    label: t("icons.website"),
    value: "Globe",
    icon: Globe,
    category: t("categories.personal"),
  },
  {
    label: t("icons.mobile"),
    value: "Smartphone",
    icon: Smartphone,
    category: t("categories.personal"),
  },

  // 教育背景类
  {
    label: t("icons.education"),
    value: "GraduationCap",
    icon: GraduationCap,
    category: t("categories.education"),
  },
  {
    label: t("icons.school"),
    value: "School",
    icon: School,
    category: t("categories.education"),
  },
  {
    label: t("icons.major"),
    value: "Book",
    icon: Book,
    category: t("categories.education"),
  },
  {
    label: t("icons.library"),
    value: "Library",
    icon: Library,
    category: t("categories.education"),
  },
  {
    label: t("icons.scholarship"),
    value: "Award",
    icon: Award,
    category: t("categories.education"),
  },

  // 工作经验类
  {
    label: t("icons.work"),
    value: "Briefcase",
    icon: Briefcase,
    category: t("categories.experience"),
  },
  {
    label: t("icons.company"),
    value: "Building2",
    icon: Building2,
    category: t("categories.experience"),
  },
  {
    label: t("icons.office"),
    value: "Building",
    icon: Building,
    category: t("categories.experience"),
  },
  {
    label: t("icons.dateRange"),
    value: "CalendarRange",
    icon: CalendarRange,
    category: t("categories.experience"),
  },
  {
    label: t("icons.workTime"),
    value: "Clock",
    icon: Clock,
    category: t("categories.experience"),
  },

  // 技能类
  {
    label: t("icons.programming"),
    value: "Code",
    icon: Code,
    category: t("categories.skills"),
  },
  {
    label: t("icons.system"),
    value: "Cpu",
    icon: Cpu,
    category: t("categories.skills"),
  },
  {
    label: t("icons.database"),
    value: "Database",
    icon: Database,
    category: t("categories.skills"),
  },
  {
    label: t("icons.terminal"),
    value: "Terminal",
    icon: Terminal,
    category: t("categories.skills"),
  },
  {
    label: t("icons.techStack"),
    value: "Layers",
    icon: Layers,
    category: t("categories.skills"),
  },

  // 语言类
  {
    label: t("icons.language"),
    value: "Languages",
    icon: Languages,
    category: t("categories.languages"),
  },
  {
    label: t("icons.speaking"),
    value: "MessageSquare",
    icon: MessageSquare,
    category: t("categories.languages"),
  },
  {
    label: t("icons.communication"),
    value: "MessagesSquare",
    icon: MessagesSquare,
    category: t("categories.languages"),
  },

  // 项目经验类
  {
    label: t("icons.project"),
    value: "FolderGit2",
    icon: FolderGit2,
    category: t("categories.projects"),
  },
  {
    label: t("icons.branch"),
    value: "GitBranch",
    icon: GitBranch,
    category: t("categories.projects"),
  },
  {
    label: t("icons.release"),
    value: "Rocket",
    icon: Rocket,
    category: t("categories.projects"),
  },
  {
    label: t("icons.target"),
    value: "Target",
    icon: Target,
    category: t("categories.projects"),
  },

  // 成就与证书类
  {
    label: t("icons.trophy"),
    value: "Trophy",
    icon: Trophy,
    category: t("categories.achievements"),
  },
  {
    label: t("icons.medal"),
    value: "Medal",
    icon: Medal,
    category: t("categories.achievements"),
  },
  {
    label: t("icons.star"),
    value: "Star",
    icon: Star,
    category: t("categories.achievements"),
  },

  // 兴趣爱好类
  {
    label: t("icons.interest"),
    value: "Heart",
    icon: Heart,
    category: t("categories.hobbies"),
  },
  {
    label: t("icons.music"),
    value: "Music",
    icon: Music,
    category: t("categories.hobbies"),
  },
  {
    label: t("icons.art"),
    value: "Palette",
    icon: Palette,
    category: t("categories.hobbies"),
  },
  {
    label: t("icons.photography"),
    value: "Camera",
    icon: Camera,
    category: t("categories.hobbies"),
  },

  // 社交媒体类
  {
    label: "Github",
    value: "Github",
    icon: Github,
    category: t("categories.social"),
  },
  {
    label: t("icons.linkedin"),
    value: "Linkedin",
    icon: Linkedin,
    category: t("categories.social"),
  },
  {
    label: t("icons.twitter"),
    value: "Twitter",
    icon: Twitter,
    category: t("categories.social"),
  },
  {
    label: t("icons.facebook"),
    value: "Facebook",
    icon: Facebook,
    category: t("categories.social"),
  },
  {
    label: t("icons.instagram"),
    value: "Instagram",
    icon: Instagram,
    category: t("categories.social"),
  },

  // 其他类
  {
    label: t("icons.profile"),
    value: "FileText",
    icon: FileText,
    category: t("categories.others"),
  },
  {
    label: t("icons.review"),
    value: "FileCheck",
    icon: FileCheck,
    category: t("categories.others"),
  },
  {
    label: t("icons.filter"),
    value: "Filter",
    icon: Filter,
    category: t("categories.others"),
  },
  {
    label: t("icons.link"),
    value: "Link",
    icon: Link,
    category: t("categories.others"),
  },
  {
    label: t("icons.salary"),
    value: "Wallet",
    icon: Wallet,
    category: t("categories.others"),
  },
  {
    label: t("icons.idea"),
    value: "Lightbulb",
    icon: Lightbulb,
    category: t("categories.others"),
  },
  {
    label: t("icons.send"),
    value: "Send",
    icon: Send,
    category: t("categories.others"),
  },
  {
    label: t("icons.share"),
    value: "Share2",
    icon: Share2,
    category: t("categories.others"),
  },
  {
    label: t("icons.settings"),
    value: "Settings",
    icon: Settings,
    category: t("categories.others"),
  },
  {
    label: t("icons.search"),
    value: "SearchIcon",
    icon: SearchIcon,
    category: t("categories.others"),
  },
  {
    label: t("icons.flag"),
    value: "Flag",
    icon: Flag,
    category: t("categories.others"),
  },
  {
    label: t("icons.bookmark"),
    value: "Bookmark",
    icon: Bookmark,
    category: t("categories.others"),
  },
  {
    label: t("icons.thumbsUp"),
    value: "ThumbsUp",
    icon: ThumbsUp,
    category: t("categories.others"),
  },
  {
    label: t("icons.skill"),
    value: "Zap",
    icon: Zap,
    category: t("categories.others"),
  },
];

const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange }) => {
  const t = useTranslations("iconSelector");
  const iconOptions = React.useMemo(() => getIconOptions(t), [t]);
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isHovered, setIsHovered] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(t("all"));

  const selectedIcon =
    iconOptions.find((i) => i.value === value) || iconOptions[0];
  const Icon = selectedIcon.icon;

  const categories = [
    t("all"),
    ...Array.from(new Set(iconOptions.map((icon) => icon.category))),
  ];

  const filteredIcons = iconOptions.filter((icon) => {
    const matchesSearch =
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === t("all") || icon.category === selectedCategory;
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
            "dark:bg-neutral-800 dark:hover:bg-neutral-700/90",
            "bg-white hover:bg-neutral-50/90 "
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4 transform-gpu transition-transform duration-300",
              "hover:rotate-[360deg]",
              "dark:text-neutral-200",
              "text-neutral-700"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[420px] p-4",
          "dark:bg-neutral-900 dark:border-neutral-800",
          "bg-white border-neutral-200",
          "shadow-lg backdrop-blur-sm",
          "animate-in zoom-in-95 duration-200"
        )}
      >
        <div className="space-y-3">
          <div
            className={cn(
              "flex border items-center gap-2 px-3 py-2 rounded-lg",
              "transform-gpu transition-all duration-300",
              "dark:bg-neutral-800/50  dark:border-neutral-700",
              "bg-neutral-50 border border-neutral-200",
              "dark:focus-within:ring-blue-500/30",
              "focus-within:ring-blue-500/20"
            )}
          >
            <Search
              className={cn(
                "w-4 h-4 transition-colors duration-300",
                "dark:text-neutral-400",
                "text-neutral-500"
              )}
            />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full bg-transparent border-none outline-none text-sm",
                "transition-colors duration-300",
                "dark:text-neutral-200",
                "text-neutral-700",
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
                    ? "bg-primary text-white dark:ring-1 dark:ring-blue-500/30  ring-1 ring-blue-500/20"
                    : "dark:text-white  text-neutral-600 hover:text-neutral-900"
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
                  "relative p-2 h-10  group",
                  "dark:hover:bg-neutral-800/70 dark:text-neutral-300 hover:text-neutral-200",
                  "hover:bg-neutral-100/70 text-neutral-600 hover:text-neutral-900",
                  value === iconValue && "bg-primary text-white  "
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
                    "dark:bg-neutral-800 dark:text-neutral-200 border dark:border-neutral-700",
                    "bg-white text-neutral-700 border dark:border-neutral-200",
                    "shadow-sm whitespace-nowrap z-10"
                  )}
                >
                  {label}
                </span>
                {isHovered === iconValue && (
                  <span
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r",
                      "dark:from-blue-500/10 dark:to-purple-500/10",
                      "from-blue-500/5 to-purple-500/5",
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
                "dark:text-neutral-400",
                "text-neutral-500"
              )}
            >
              <SearchIcon className="w-12 h-12 mb-2 opacity-20" />
              <p>{t("noMatchingIcons")}</p>
              <p className="text-xs opacity-70">
                {searchTerm ? t("tryOtherKeywords") : t("selectOtherCategory")}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconSelector;
