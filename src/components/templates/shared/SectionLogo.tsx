import React from "react";
import { LogoConfig, getBorderRadiusValue } from "@/types/resume";
import { logoImageSource, normalizeLogoConfig } from "@/utils/logo";

interface SectionLogoProps {
  src?: string;
  config?: LogoConfig;
  size?: number;
}

const SectionLogo: React.FC<SectionLogoProps> = ({ src, config, size = 20 }) => {
  if (!src || config?.visible === false) return null;

  const resolvedConfig = normalizeLogoConfig(config, size);
  const { width, height } = resolvedConfig;

  return (
    <img
      src={logoImageSource(src)}
      alt=""
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: "contain",
        flexShrink: 0,
        borderRadius: getBorderRadiusValue(resolvedConfig),
      }}
    />
  );
};

export default SectionLogo;
