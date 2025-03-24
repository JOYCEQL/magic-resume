"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  PhotoConfig,
  DEFAULT_CONFIG,
  getRatioMultiplier,
  getBorderRadiusValue,
} from "@/types/resume";
import { Textarea } from "@/components/ui/textarea";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatar.png";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  photo?: string;
  config?: PhotoConfig;
  onPhotoChange: (photo: string | undefined, config?: PhotoConfig) => void;
  onConfigChange: (config: PhotoConfig) => void;
}

const PhotoConfigDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  photo,
  config: initialConfig,
  onPhotoChange,
  onConfigChange,
  ...props
}) => {
  const t = useTranslations("photoConfig");
  const { updateBasicInfo } = useResumeStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(photo);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState(photo || "");
  const drawerContentRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<PhotoConfig>(
    initialConfig || DEFAULT_CONFIG
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig || DEFAULT_CONFIG);
      setPreviewUrl(photo === "" ? "" : photo || DEFAULT_AVATAR);
      setImageUrl(photo === DEFAULT_AVATAR ? "" : photo || "");
    }

    const handleClick = (e: MouseEvent) => {
      if (!drawerContentRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, initialConfig, photo]);



  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("upload.typeLimit"));
      return;
    }

    try {
      let imageData: string;
      if (file.size > 2 * 1024 * 1024) {
        try {
          imageData = await compressImage(file, 800, 800, 0.7);

          let compressedSize = estimateBase64Size(imageData);
          if (compressedSize > 2 * 1024 * 1024) {
            imageData = await compressImage(file, 600, 600, 0.5);
            compressedSize = estimateBase64Size(imageData);

            if (compressedSize > 2 * 1024 * 1024) {
              imageData = await compressImage(file, 400, 400, 0.4);
            }
          }

          console.log(
            `原始图片大小: ${(file.size / 1024).toFixed(2)}KB, 压缩后大小: ${(
              estimateBase64Size(imageData) / 1024
            ).toFixed(2)}KB`
          );
        } catch (error) {
          toast.error(t("upload.sizeLimit"));
          return;
        }
      } else {
        // 如果图片小于2MB，但仍然进行轻度压缩以优化性能
        imageData = await compressImage(file, 1200, 1200, 0.8);
      }

      setPreviewUrl(imageData);
      setImageUrl(imageData);
      updateBasicInfo({
        photo: imageData,
      });
    } catch (error) {
      toast.error(t("upload.error"));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlChange = async (e: string) => {
    const url = e.trim();
    setImageUrl(url);
    if (!url) {
      handleRemovePhoto();
      return;
    }

    try {
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(url)}`;

      const img = new Image();
      img.crossOrigin = "anonymous";

      // 检查图片大小
      const checkImageSize = () => {
        return new Promise<void>((resolve, reject) => {
          fetch(proxyUrl, { method: "HEAD" })
            .then((response) => {
              const contentLength = response.headers.get("content-length");
              if (contentLength) {
                const size = parseInt(contentLength, 10);
                if (size > 2 * 1024 * 1024) {
                  reject(new Error(t("upload.sizeLimit")));
                }
              }
              resolve();
            })
            .catch(() => {
              // 如果无法获取大小，则继续尝试加载图片
              resolve();
            });
        });
      };

      // 先检查图片大小
      await checkImageSize();

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(t("upload.timeout")));
        }, 10000);

        img.onload = () => {
          clearTimeout(timer);
          resolve(undefined);
        };
        img.onerror = () => {
          clearTimeout(timer);
          reject(new Error(t("upload.loadError")));
        };
        img.src = proxyUrl;
      });

      setPreviewUrl(proxyUrl);
      updateBasicInfo({
        photo: url,
      });
      onPhotoChange(url, config);
    } catch (error) {
      toast.error(
        t("upload.invalidUrl", {
          defaultMessage: "图片链接无效或无法访问，请尝试使用其他图片链接",
        })
      );
      handleRemovePhoto();
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

  const handleRemovePhoto = () => {
    setPreviewUrl("");
    setImageUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    updateBasicInfo({
      photo: "",
    });

    onPhotoChange("", config);

    setTimeout(() => {
      setPreviewUrl("");
    }, 0);
  };

  const handleConfigChange = (updates: Partial<PhotoConfig>) => {
    const newConfig = { ...config, ...updates };

    if (config.aspectRatio !== "custom") {
      if ("width" in updates) {
        const ratio = getRatioMultiplier(config.aspectRatio);
        newConfig.height =
          Math.round(updates.width! * ratio) > 200
            ? 200
            : Math.round(updates.width! * ratio);
      }
      if ("height" in updates) {
        const ratio = 1 / getRatioMultiplier(config.aspectRatio);
        newConfig.width =
          Math.round(updates.height! * ratio) > 200
            ? 200
            : Math.round(updates.height! * ratio);
      }
    }

    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "width" | "height" | "customBorderRadius"
  ) => {
    const value = Number(e.target.value) > 200 ? 200 : e.target.value;

    if (value === "") {
      setConfig((prev) => ({ ...prev, [key]: "" }));
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
      const validValue = Math.max(24, Math.min(numValue, 200));
      handleConfigChange({ [key]: validValue });
    }
  };

  const handleSave = () => {
    onPhotoChange(previewUrl, config);
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
          "md:fixed md:border-none md:flex md:bottom-0 md:left-0 md:right-0 md:h-[93%] md:max-w-[360px] md:mx-[-1px] md:z-10 md:outline-none shadow shadow-blue-500/40"
        )}
      >
        <div className="mx-auto w-full max-w-md overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center">{t("title")}</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div
            className={cn(
              "relative overflow-hidden border-2 transition-all mx-auto",
              isDragging ? "border-blue-500 border-solid" : "border-dashed",
              "dark:border-neutral-700 dark:hover:border-neutral-600 border-neutral-300 hover:border-neutral-400"
            )}
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
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
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity",
                    "group-hover:opacity-100"
                  )}
                >
                  <Button
                    onClick={handleRemovePhoto}
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
          <div className="p-6 space-y-6">
            <span className="text-sm">{t("upload.dragHint")}</span>
            <span className="ml-2 text-xs text-neutral-500 mt-1">
              ({t("upload.sizeLimit")})
            </span>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">{t("upload.title")}</h3>
              <Textarea
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t("upload.urlPlaceholder")}
                className={cn(
                  "h-9",
                  "dark:bg-neutral-800 dark:border-neutral-700"
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("config.size")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      value={config.width}
                      onChange={(e) => handleInputChange(e, "width")}
                      onBlur={(e) => handleInputBlur(e, "width")}
                      className={cn(
                        "h-9 pr-7",
                        "dark:bg-neutral-800 dark:border-neutral-700"
                      )}
                      min={24}
                      max={200}
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
                      onChange={(e) => handleInputChange(e, "height")}
                      onBlur={(e) => handleInputBlur(e, "height")}
                      className={cn(
                        "h-9 pr-7",
                        "dark:bg-neutral-800 dark:border-neutral-700"
                      )}
                      min={24}
                      max={200}
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
                          if (ratio !== "custom") {
                            const height = Math.round(
                              config.width * getRatioMultiplier(ratio)
                            );
                            handleConfigChange({ aspectRatio: ratio, height });
                          } else {
                            handleConfigChange({ aspectRatio: ratio });
                          }
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
                  {t("config.border-radius")}
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
                          ? t("config.borderRadius.none")
                          : radius === "medium"
                          ? t("config.borderRadius.medium")
                          : radius === "full"
                          ? t("config.borderRadius.full")
                          : t("config.borderRadius.custom")}
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
                      placeholder={t("config.borderRadius.customPlaceholder")}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  variant="destructive"
                >
                  {t("actions.close")}
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PhotoConfigDrawer;
