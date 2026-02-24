import React, { createContext, useContext } from "react";
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
  return (
    <TemplateContext.Provider value={{ templateId, menuSections }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  return useContext(TemplateContext);
};
