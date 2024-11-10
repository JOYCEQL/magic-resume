import React from "react";
import { User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// 定义一个简单的图标列表作为示例
const ICONS = [
  { name: "User", component: User }
  // 其他图标将在选择后动态导入
];

const IconSelector = ({ value, onChange, theme = "light" }) => {
  const [open, setOpen] = React.useState(false);
  const [icons, setIcons] = React.useState(ICONS);

  // 获取当前选中的图标组件
  const getCurrentIcon = React.useCallback(() => {
    if (!value) return User;
    const icon = icons.find((i) => i.name === value);
    return icon ? icon.component : User;
  }, [value, icons]);

  const IconComponent = getCurrentIcon();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded border",
            theme === "dark"
              ? "bg-neutral-900 border-neutral-700 text-neutral-200"
              : "bg-white border-gray-200 text-gray-900"
          )}
        >
          <IconComponent className="w-4 h-4" />
          <span>{value || "选择图标"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command
          className={cn(
            "w-[200px]",
            theme === "dark" ? "bg-neutral-900" : "bg-white"
          )}
        >
          <CommandInput
            placeholder="搜索图标..."
            className={cn(
              theme === "dark" ? "border-neutral-700" : "border-gray-200"
            )}
          />
          <CommandEmpty>未找到图标</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {icons?.map(({ name, component: Icon }) => (
              <CommandItem
                key={name}
                value={name.toLowerCase()}
                onSelect={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 cursor-pointer py-2",
                  theme === "dark"
                    ? "hover:bg-neutral-800"
                    : "hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default IconSelector;
