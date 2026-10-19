import { DEFAULT_LOGO_CONFIG, getRatioMultiplier, type LogoConfig, type ResumeData } from "@/types/resume";

/** Remove only the bundled images that were previously prefilled in new resumes. */
export function removeDefaultResumeLogos(resume: ResumeData): ResumeData {
  const isDefault = (logo?: string) => logo === "/university.png" || logo === "/company.png";
  const clearDefaults = <T extends { logo?: string }>(items: T[]): T[] =>
    items.some(item => isDefault(item.logo))
      ? items.map(item => isDefault(item.logo) ? { ...item, logo: "" } : item)
      : items;
  const education = clearDefaults(resume.education ?? []);
  const experience = clearDefaults(resume.experience ?? []);
  return education === resume.education && experience === resume.experience
    ? resume : { ...resume, education, experience };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const dimension = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? clamp(value, 8, 60) : fallback;

/** Old resumes may have no logo configuration, or only a visibility flag. */
export function normalizeLogoConfig(config?: Partial<LogoConfig>, size = DEFAULT_LOGO_CONFIG.width): LogoConfig {
  return {
    ...DEFAULT_LOGO_CONFIG,
    ...config,
    width: dimension(config?.width, size),
    height: dimension(config?.height, size),
    aspectRatio: config?.aspectRatio ?? DEFAULT_LOGO_CONFIG.aspectRatio,
    borderRadius: config?.borderRadius ?? DEFAULT_LOGO_CONFIG.borderRadius,
    customBorderRadius: typeof config?.customBorderRadius === "number" && Number.isFinite(config.customBorderRadius)
      ? Math.max(0, config.customBorderRadius) : 0,
    visible: config?.visible !== false,
  };
}

export function updateLogoConfig(config: LogoConfig, updates: Partial<LogoConfig>): LogoConfig {
  const next = normalizeLogoConfig({ ...config, ...updates });
  if (next.aspectRatio !== "custom") {
    const ratio = getRatioMultiplier(next.aspectRatio);
    if (updates.width !== undefined || updates.aspectRatio !== undefined) {
      next.width = Math.round(clamp(next.width, Math.max(8, 8 / ratio), Math.min(60, 60 / ratio)));
      next.height = Math.round(next.width * ratio);
    } else if (updates.height !== undefined) {
      next.height = Math.round(clamp(next.height, Math.max(8, 8 * ratio), Math.min(60, 60 * ratio)));
      next.width = Math.round(next.height / ratio);
    }
  }
  next.customBorderRadius = Math.min(next.customBorderRadius, Math.min(next.width, next.height) / 2);
  return next;
}

/** Remote logos use the same-origin proxy in previews and all export paths. */
export function logoImageSource(src: string): string {
  return /^https?:\/\//i.test(src) ? `/api/proxy/image?url=${encodeURIComponent(src)}` : src;
}
