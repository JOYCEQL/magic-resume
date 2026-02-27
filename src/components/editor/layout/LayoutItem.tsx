
import { motion, Reorder, useDragControls } from "framer-motion";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuSection } from "@/types/resume";
import { useTranslations } from "@/i18n/compat/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LayoutItemProps {
  item: MenuSection;
  isBasic?: boolean;
  activeSection: string;
  setActiveSection: (id: string) => void;
  toggleSectionVisibility: (id: string) => void;
  updateMenuSections: (sections: MenuSection[]) => void;
  menuSections: MenuSection[];
}

const LayoutItem = ({
  item,
  isBasic = false,
  activeSection,
  setActiveSection,
  toggleSectionVisibility,
  updateMenuSections,
  menuSections
}: LayoutItemProps) => {
  const dragControls = useDragControls();
  const t = useTranslations("common");

  if (isBasic) {
    return (
      <div
        className={cn(
          "rounded-lg group border mb-2",
          "bg-card border-border",
          "hover:border-primary/50 transition-colors",
          activeSection === item.id &&
          "border-primary text-primary ring-1 ring-primary"
        )}
        onClick={() => setActiveSection(item.id)}
      >
        <div className="flex items-center p-3 pl-[32px] space-x-3">
          <span
            className={cn(
              "text-lg  ml-[12px]",
              "text-muted-foreground group-hover:text-foreground transition-colors"
            )}
          >
            {item.icon}
          </span>
          <span className={cn("text-sm flex-1 cursor-pointer")}>
            {item.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Reorder.Item
      id={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "rounded-lg group border flex overflow-hidden ",
        "bg-card border-border",
        "hover:border-primary/50 transition-colors",
        activeSection === item.id &&
        "border-primary text-primary ring-1 ring-primary"
      )}
      whileHover={{ scale: 1.01 }}
      whileDrag={{ scale: 1.02 }}
    >
      <div
        onPointerDown={(event) => {
          dragControls.start(event);
        }}
        className={cn(
          "w-8 flex items-center justify-center  touch-none shrink-0",
          "border-border",
          "cursor-grab hover:bg-muted/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            "text-muted-foreground",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      <div
        className="flex select-none items-center p-3 space-x-3 flex-1  cursor-pointer"
        onClick={() => setActiveSection(item.id)}
      >
        <div className="flex flex-1 items-center">
          <span
            className={cn(
              "text-lg mr-2",
              "text-muted-foreground group-hover:text-foreground transition-colors"
            )}
          >
            {item.icon}
          </span>
          <span className="text-sm flex-1">{item.title}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionVisibility(item.id);
            }}
            className={cn(
              "p-1.5 rounded-md mr-2",
              "hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            )}
          >
            {item.enabled ? (
              <Eye className="w-4 h-4 text-primary" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </motion.button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "p-1.5 rounded-md text-primary",
                  "hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                )}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delete")} {item.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除此模块吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    updateMenuSections(
                      menuSections.filter((section) => section.id !== item.id)
                    );
                    setActiveSection(
                      menuSections[
                        menuSections.findIndex((s) => s.id === item.id) - 1
                      ].id
                    );
                  }}
                  className="bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white shadow-sm border-0"
                >
                  {t("confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Reorder.Item>
  );
};

export default LayoutItem;
