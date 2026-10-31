import React, { createContext, useContext, useMemo } from "react";
import { MenuSection } from "@/types/resume";

interface TemplateContextProps {
  templateId: string;
  menuSections: MenuSection[];
}

const TemplateContext = createContext<TemplateContextProps | undefined>(undefined);

export const TemplateProvider: React.FC<{
  templateId: string;
  menuSections: MenuSection[];
  children: React.ReactNode;
}> = ({ templateId, menuSections, children }) => {
  const value = useMemo(
    () => ({ templateId, menuSections }),
    [templateId, menuSections]
  );

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  return useContext(TemplateContext);
};
