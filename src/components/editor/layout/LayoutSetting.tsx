"use client";
import { Reorder } from "framer-motion";
import { MenuSection } from "@/types/resume";
import LayoutItem from "./LayoutItem";

interface LayoutPanelProps {
  menuSections: MenuSection[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  toggleSectionVisibility: (id: string) => void;
  updateMenuSections: (sections: MenuSection[]) => void;
  reorderSections: (sections: MenuSection[]) => void;
}

const LayoutSetting = ({
  menuSections,
  activeSection,
  setActiveSection,
  toggleSectionVisibility,
  updateMenuSections,
  reorderSections,
}: LayoutPanelProps) => {
  const basicSection = menuSections.find((item) => item.id === "basic");
  const draggableSections = menuSections.filter((item) => item.id !== "basic");

  return (
    <div className="space-y-4  rounded-lg bg-white dark:bg-neutral-900/30">
      {basicSection && (
        <LayoutItem
          item={basicSection}
          isBasic={true}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          toggleSectionVisibility={toggleSectionVisibility}
          updateMenuSections={updateMenuSections}
          menuSections={menuSections}
        />
      )}

      <Reorder.Group
        axis="y"
        values={draggableSections}
        onReorder={(newOrder) => {
          const updatedSections = [
            ...menuSections.filter((item) => item.id === "basic"),
            ...newOrder,
          ];
          reorderSections(updatedSections);
        }}
        className="space-y-2"
      >
        {draggableSections.map((item) => (
          <LayoutItem
            key={item.id}
            item={item}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            toggleSectionVisibility={toggleSectionVisibility}
            updateMenuSections={updateMenuSections}
            menuSections={menuSections}
          />
        ))}
      </Reorder.Group>
    </div>
  );
};

export default LayoutSetting;
