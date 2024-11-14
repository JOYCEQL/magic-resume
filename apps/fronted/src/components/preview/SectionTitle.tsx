import { GlobalSettings } from "@/types/resume";

interface SectionTitleProps {
  title: string;
  themeColor: string;
  globalSettings: GlobalSettings;
}

export function SectionTitle({
  title,
  themeColor,
  globalSettings
}: SectionTitleProps) {
  const sectionTitleStyles = {
    fontSize: `${globalSettings?.headerSize || 18}px`,
    borderColor: themeColor,
    color: themeColor
  };

  return (
    <h3
      className="text-lg font-semibold border-b border-gray-200 pb-2"
      style={sectionTitleStyles}
    >
      {title}
    </h3>
  );
}
