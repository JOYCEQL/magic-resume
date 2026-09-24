import React, { useState } from "react";
import { Settings2, Image, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LogoConfigDrawer from "./LogoConfigDrawer";
import { LogoConfig } from "@/types/resume";
import { getBorderRadiusValue } from "@/types/resume";
import { useTranslations } from "@/i18n/compat/client";

interface Props {
  logo?: string;
  config?: LogoConfig;
  onLogoChange: (logo: string | undefined, config?: LogoConfig) => void;
  onConfigChange: (config: LogoConfig) => void;
  className?: string;
}

const LogoSelector: React.FC<Props> = ({
  logo,
  config,
  onLogoChange,
  onConfigChange,
  className,
}) => {
  const t = useTranslations("workbench.logoUploader");
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          <span className="text-sm font-medium">{t("label")}</span>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => setShowConfig(true)}
          >
            <Settings2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => {
              onConfigChange({
                ...config,
                visible: !(config?.visible ?? true),
              } as LogoConfig);
            }}
          >
            {config?.visible !== false ? (
              <Eye className="w-4 h-4 text-primary" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-2 relative overflow-hidden">
        {logo && (
          <img
            src={logo}
            alt="Logo"
            className={cn(
              "w-[48px] h-[48px] object-contain",
              config?.visible === false && "opacity-30"
            )}
            style={{ borderRadius: getBorderRadiusValue(config) }}
          />
        )}
      </div>

      <LogoConfigDrawer
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        logo={logo}
        config={config}
        onLogoChange={onLogoChange}
        onConfigChange={onConfigChange}
      />
    </div>
  );
};

export default LogoSelector;
