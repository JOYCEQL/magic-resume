import { useCallback, useState } from "react";
import {
  motion,
  useDragControls,
  Reorder,
  AnimatePresence
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { GripVertical, Eye, EyeOff, ChevronDown, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import Field from "../Field";

import { CustomItem as CustomItemType } from "@/types/resume";
const CustomItemEditor = ({
  item,
  onSave
}: {
  item: CustomItemType;
  onSave: (item: CustomItemType) => void;
}) => {
  const handleChange = (field: keyof CustomItemType, value: string) => {
    onSave({ ...item, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="标题"
            value={item.title}
            onChange={(value) => handleChange("title", value)}
            placeholder="标题"
          />
          <Field
            label="副标题"
            value={item.subtitle}
            onChange={(value) => handleChange("subtitle", value)}
            placeholder="副标题"
          />
        </div>

        <Field
          label="时间范围"
          value={item.dateRange}
          onChange={(value) => handleChange("dateRange", value)}
          placeholder="例如: 2023.01 - 2024.01"
        />

        <Field
          label="详细描述"
          value={item.description}
          onChange={(value) => handleChange("description", value)}
          type="editor"
          placeholder="请输入详细描述..."
        />
      </div>
    </div>
  );
};

const DeleteConfirmDialog = ({
  title,
  onDelete
}: {
  title: string;
  onDelete: () => void;
}) => {
  const theme = useResumeStore((state) => state.theme);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-sm",
            theme === "dark"
              ? "hover:bg-red-900/50 text-red-400"
              : "hover:bg-red-50 text-red-600"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className={cn(
          theme === "dark" ? "bg-neutral-900 border-neutral-800" : "bg-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除 {title || "此项"} 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const CustomItem = ({
  item,
  sectionId
}: {
  item: CustomItemType;
  sectionId: string;
}) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { theme, updateCustomItem, removeCustomItem } = useResumeStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateCustomItem(sectionId, item.id, { visible: !item.visible });
        setIsUpdating(false);
      }, 10);
    },
    [item, updateCustomItem, isUpdating, sectionId]
  );

  return (
    <Reorder.Item
      id={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "rounded-lg border overflow-hidden flex group",
        theme === "dark"
          ? "bg-neutral-900/30 border-neutral-800"
          : "bg-white border-gray-100"
      )}
    >
      <div
        onPointerDown={(event) => {
          if (expandedId === item.id) return;
          dragControls.start(event);
        }}
        className={cn(
          "w-12 flex items-center justify-center border-r shrink-0 touch-none",
          theme === "dark" ? "border-neutral-800" : "border-gray-100",
          expandedId === item.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-neutral-400" : "text-gray-400",
            expandedId === item.id && "opacity-50"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === item.id &&
              (theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50")
          )}
          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium truncate text-gray-700",
                "dark:text-neutral-200"
              )}
            >
              {item.title || "未命名模块"}
            </h3>
            {item.subtitle && (
              <p
                className={cn(
                  "text-sm truncate",
                  theme === "dark" ? "text-neutral-400" : "text-gray-500"
                )}
              >
                {item.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={handleVisibilityToggle}
            >
              {item.visible ? (
                <Eye className="w-4 h-4 text-indigo-600" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <DeleteConfirmDialog
              title={item.title}
              onDelete={() => {
                removeCustomItem(sectionId, item.id);
                setExpandedId(null);
              }}
            />
            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === item.id ? 180 : 0
              }}
            >
              <ChevronDown
                className={cn(
                  "w-5 h-5",
                  theme === "dark" ? "text-neutral-400" : "text-gray-500"
                )}
              />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {expandedId === item.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "px-4 pb-4 space-y-4",
                  theme === "dark" ? "border-neutral-800" : "border-gray-100"
                )}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
                  )}
                />
                <CustomItemEditor
                  item={item}
                  onSave={(updatedItem) => {
                    updateCustomItem(sectionId, item.id, updatedItem);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

export default CustomItem;
