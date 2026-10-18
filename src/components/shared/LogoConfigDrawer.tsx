import React, { lazy, Suspense, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Upload, X } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { toast } from "sonner";
import { compressImage, estimateBase64Size } from "@/utils/imageUtils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LogoConfig,
  getBorderRadiusValue,
} from "@/types/resume";
import { cn } from "@/lib/utils";
import { logoImageSource, normalizeLogoConfig, updateLogoConfig } from "@/utils/logo";
import { useIsMobile } from "@/hooks/use-mobile";

const SchoolLogoSearch = lazy(() => import("./SchoolLogoSearch"));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logo?: string;
  config?: LogoConfig;
  onLogoChange: (logo: string | undefined, config?: LogoConfig) => void;
  onConfigChange: (config: LogoConfig) => void;
  schoolName?: string;
}

const LogoConfigDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  logo,
  config: initialConfig,
  onLogoChange,
  onConfigChange,
  schoolName,
}) => {
  const t = useTranslations("workbench.logoUploader");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(logo);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<LogoConfig>(
    normalizeLogoConfig(initialConfig)
  );
  const isMobile = useIsMobile();
  const wasOpen = useRef(false);
  const imageRevision = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSchoolSearch, setShowSchoolSearch] = useState(false);
  const pendingImage = useRef<AbortController>();
  // Image decoding is async; use the latest form callbacks/config when it finishes.
  const latest = useRef({ onLogoChange, config });
  latest.current = { onLogoChange, config };

  useEffect(() => () => {
    imageRevision.current += 1;
    pendingImage.current?.abort();
  }, []);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setConfig(normalizeLogoConfig(initialConfig));
      setPreviewUrl(logo || "");
      setImageUrl(logo?.startsWith("data:") ? "" : logo || "");
      setIsLoading(false);
    }
    if (!isOpen) imageRevision.current += 1;
    wasOpen.current = isOpen;
  }, [isOpen, initialConfig, logo]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!drawerContentRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("typeLimit"));
      return;
    }
    const revision = ++imageRevision.current;
    pendingImage.current?.abort();

    try {
      setIsLoading(true);
      let imageData: string;
      if (file.size > 2 * 1024 * 1024) {
        imageData = await compressImage(file, 200, 200, 0.6);
        let compressedSize = estimateBase64Size(imageData);
        if (compressedSize > 1 * 1024 * 1024) {
          imageData = await compressImage(file, 100, 100, 0.4);
        }
      } else {
        imageData = await compressImage(file, 200, 200, 0.8);
      }

      if (revision !== imageRevision.current) return;
      setPreviewUrl(imageData);
      setImageUrl("");
      latest.current.onLogoChange(imageData, latest.current.config);
    } catch {
      if (revision === imageRevision.current) toast.error(t("uploadError"));
    } finally {
      if (revision === imageRevision.current) setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlChange = async (url: string) => {
    const revision = ++imageRevision.current;
    pendingImage.current?.abort();
    const controller = new AbortController();
    pendingImage.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    const trimmed = url.trim();

    try {
      setIsLoading(true);
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid URL");
      const response = await fetch(logoImageSource(trimmed), { signal: controller.signal });
      if (!response.ok) throw new Error("Image request failed");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Not an image");
      const imageData = await compressImage(new File([blob], "logo", { type: blob.type }), 200, 200, 0.8);
      if (revision !== imageRevision.current) return;
      // Persist pixels, so exports and later offline use do not need the host.
      setPreviewUrl(imageData);
      setImageUrl("");
      latest.current.onLogoChange(imageData, latest.current.config);
    } catch {
      if (revision === imageRevision.current) toast.error(t("invalidUrl"));
    } finally {
      window.clearTimeout(timeout);
      if (revision === imageRevision.current) setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveLogo = () => {
    imageRevision.current += 1;
    pendingImage.current?.abort();
    setIsLoading(false);
    setPreviewUrl("");
    setImageUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onLogoChange("", config);

  };

  const handleConfigChange = (updates: Partial<LogoConfig>) => {
    const newConfig = updateLogoConfig(config, updates);

    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "width" | "height" | "customBorderRadius"
  ) => {
    const value = e.target.value;

    if (value === "") {
      return;
    }

    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setConfig((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handleInputBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    key: "width" | "height" | "customBorderRadius"
  ) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : Number(value);

    if (key === "customBorderRadius") {
      const maxRadius = Math.min(config.width, config.height) / 2;
      const validValue = Math.max(0, Math.min(numValue, maxRadius));
      handleConfigChange({ customBorderRadius: validValue });
    } else {
      const validValue = Math.max(8, Math.min(numValue, 60));
      handleConfigChange({ [key]: validValue });
    }
  };

  const handleSave = () => {
    onClose();
  };

  return (
    <Drawer
      direction={isMobile ? "bottom" : "left"}
      modal={false}
      open={isOpen}
      dismissible={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent
        ref={drawerContentRef}
        className={cn(
          "dark:bg-neutral-900 dark:text-white bg-white",
          "max-h-[92dvh] md:max-h-none",
          "md:fixed md:border-none md:flex md:bottom-0 md:left-0 md:right-0 md:h-[93%] md:max-w-[360px] md:mx-[-1px] md:z-10 md:outline-none shadow shadow-blue-500/40"
        )}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="text-center">
              {t("drawerTitle")}
            </DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div
              className={cn(
                "relative overflow-hidden border-2 transition-all mx-auto",
                isDragging ? "border-blue-500 border-solid" : "border-dashed",
                "dark:border-neutral-700 dark:hover:border-neutral-600 border-neutral-300 hover:border-neutral-400"
              )}
              style={{
                width: `${Math.max(config.width * 3, 60)}px`,
                height: `${Math.max(config.height * 3, 60)}px`,
                borderRadius: getBorderRadiusValue(config),
                maxWidth: "100%",
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl && previewUrl !== "" ? (
                <div className="relative h-full group">
                  <img
                    src={logoImageSource(previewUrl)}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity",
                      "group-hover:opacity-100"
                    )}
                  >
                    <Button
                      aria-label={t("remove")}
                      onClick={handleRemoveLogo}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => inputRef.current?.click()}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center p-0"
                >
                  <Upload
                    className={cn(
                      "w-6 h-6 mb-2",
                      "dark:text-neutral-400 text-neutral-500"
                    )}
                  />
                </Button>
              )}
              <motion.input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="space-y-2 px-6 pb-1 pt-3">
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden="true" className="mr-2 h-4 w-4" />{t("uploadFile")}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">{t("dragHint")} ({t("sizeLimit")})</p>
            </div>
            <div className="p-6 space-y-6">
              {schoolName !== undefined && (
                showSchoolSearch ? (
                  <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">{t("loading")}</p>}>
                    <SchoolLogoSearch schoolName={schoolName} disabled={isLoading} onSelect={handleUrlChange} />
                  </Suspense>
                ) : (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowSchoolSearch(true)}>
                    <Search aria-hidden="true" className="mr-2 h-4 w-4" />{t("schoolSearch.open")}
                  </Button>
                )
              )}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("uploadTitle")}</h3>
                <Textarea
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  aria-label={t("uploadTitle")}
                  placeholder={t("urlPlaceholder")}
                  className={cn(
                    "h-9",
                    "dark:bg-neutral-800 dark:border-neutral-700"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUrlChange(imageUrl)}
                  disabled={isLoading || !imageUrl.trim()}
                >
                  {t(isLoading ? "loading" : "applyUrl")}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">{t("config.size")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        value={config.width}
                        aria-label={t("config.widthPlaceholder")}
                        onChange={(e) => handleInputChange(e, "width")}
                        onBlur={(e) => handleInputBlur(e, "width")}
                        className={cn(
                          "h-9 pr-7",
                          "dark:bg-neutral-800 dark:border-neutral-700"
                        )}
                        min={8}
                        max={60}
                        placeholder={t("config.widthPlaceholder")}
                      />
                      <div
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-sm",
                          "dark:text-neutral-400 text-neutral-500"
                        )}
                      >
                        W
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        value={config.height}
                        aria-label={t("config.heightPlaceholder")}
                        onChange={(e) => handleInputChange(e, "height")}
                        onBlur={(e) => handleInputBlur(e, "height")}
                        className={cn(
                          "h-9 pr-7",
                          "dark:bg-neutral-800 dark:border-neutral-700"
                        )}
                        min={8}
                        max={60}
                        placeholder={t("config.heightPlaceholder")}
                      />
                      <div
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-sm",
                          "dark:text-neutral-400 text-neutral-500"
                        )}
                      >
                        H
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">
                    {t("config.aspectRatio")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["1:1", "4:3", "3:4", "16:9", "custom"] as const).map(
                      (ratio) => (
                        <Button
                          key={ratio}
                          size="sm"
                          variant={
                            config.aspectRatio === ratio ? "default" : "outline"
                          }
                          onClick={() => {
                            handleConfigChange({ aspectRatio: ratio });
                          }}
                        >
                          {ratio === "custom" ? t("config.ratios.custom") : ratio}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">
                    {t("config.borderRadius")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["none", "medium", "full", "custom"] as const).map(
                      (radius) => (
                        <Button
                          key={radius}
                          size="sm"
                          variant={
                            config.borderRadius === radius ? "default" : "outline"
                          }
                          onClick={() =>
                            handleConfigChange({ borderRadius: radius })
                          }
                        >
                          {radius === "none"
                            ? t("config.borderRadiusOptions.none")
                            : radius === "medium"
                              ? t("config.borderRadiusOptions.medium")
                              : radius === "full"
                                ? t("config.borderRadiusOptions.full")
                                : t("config.borderRadiusOptions.custom")}
                        </Button>
                      )
                    )}
                    {config.borderRadius === "custom" && (
                      <Input
                        type="number"
                        value={config.customBorderRadius}
                        onChange={(e) =>
                          handleInputChange(e, "customBorderRadius")
                        }
                        onBlur={(e) => handleInputBlur(e, "customBorderRadius")}
                        className={cn("h-9 mt-2", "dark:bg-neutral-800")}
                        min={0}
                        max={Math.min(config.width, config.height) / 2}
                        placeholder={t("config.borderRadiusOptions.customPlaceholder")}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter className="shrink-0 border-t">
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={isLoading}
                  variant="outline"
                >
                  {t("close")}
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LogoConfigDrawer;
