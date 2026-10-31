import React from "react";
import { ResumeTemplate } from "@/types/template";
import ClassicTemplate from "./classic";

export type TemplateComponentType = React.ComponentType<{
  data: any;
  template: ResumeTemplate;
}>;

const loadedComponents = new Map<string, TemplateComponentType>([
  ["classic", ClassicTemplate],
]);

const pendingLoads = new Map<string, Promise<TemplateComponentType>>();

const TEMPLATE_LOADERS: Record<
  string,
  () => Promise<{ default: TemplateComponentType }>
> = {
  classic: async () => ({ default: ClassicTemplate }),
  modern: () => import("./modern"),
  "left-right": () => import("./left-right"),
  timeline: () => import("./timeline"),
  minimalist: () => import("./minimalist"),
  elegant: () => import("./elegant"),
  creative: () => import("./creative"),
  editorial: () => import("./editorial"),
  swiss: () => import("./swiss"),
};

export function registerTemplateComponent(
  layout: string,
  Component: TemplateComponentType
) {
  loadedComponents.set(layout, Component);
}

export function getLoadedTemplateComponent(
  layout?: string | null
): TemplateComponentType | null {
  const key = layout || "classic";
  return loadedComponents.get(key) ?? null;
}

export function preloadTemplateComponent(
  layout?: string | null
): Promise<TemplateComponentType> {
  const key = layout || "classic";
  const existing = loadedComponents.get(key);
  if (existing) {
    return Promise.resolve(existing);
  }

  const pending = pendingLoads.get(key);
  if (pending) {
    return pending;
  }

  const loader = TEMPLATE_LOADERS[key] ?? TEMPLATE_LOADERS.classic;
  const promise = loader()
    .then((mod) => {
      const Component = mod.default || ClassicTemplate;
      loadedComponents.set(key, Component);
      pendingLoads.delete(key);
      return Component;
    })
    .catch(() => {
      pendingLoads.delete(key);
      return ClassicTemplate;
    });

  pendingLoads.set(key, promise);
  return promise;
}
