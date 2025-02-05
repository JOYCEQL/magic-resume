import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import CustomItem from "./CustomItem";
import { useResumeStore } from "@/store/useResumeStore";
import { CustomItem as CustomItemType } from "@/types/resume";

const CustomPanel = memo(({ sectionId }: { sectionId: string }) => {
  const { addCustomItem, updateCustomData, activeResume } = useResumeStore();
  const { customData } = activeResume || {};
  const items = customData?.[sectionId] || [];
  const handleCreateItem = () => {
    addCustomItem(sectionId);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        "dark:bg-neutral-900/30 bg-white"
      )}
    >
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(newOrder) => {
          updateCustomData(sectionId, newOrder);
        }}
        className="space-y-3"
      >
        {items.map((item: CustomItemType) => (
          <CustomItem key={item.id} item={item} sectionId={sectionId} />
        ))}

        <Button onClick={handleCreateItem} className={cn("w-full")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </Reorder.Group>
    </div>
  );
});

CustomPanel.displayName = "CustomPanel";

export default CustomPanel;
