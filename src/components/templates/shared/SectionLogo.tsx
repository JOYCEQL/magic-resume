import React from "react";
import { LogoConfig, getBorderRadiusValue } from "@/types/resume";

interface SectionLogoProps {
  src?: string;
  config?: LogoConfig;
  size?: number;
}

const SectionLogo: React.FC<SectionLogoProps> = ({ src, config, size = 20 }) => {
  if (!src || config?.visible === false) return null;

  const width = config?.width || size;
  const height = config?.height || size;

  return (
    <img
      src={src}
      alt=""
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: "contain",
        flexShrink: 0,
        borderRadius: getBorderRadiusValue(config),
      }}
    />
  );
};

export default SectionLogo;
