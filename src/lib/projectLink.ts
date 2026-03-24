import { Project } from "@/types/resume";

const ABSOLUTE_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:/i;
const SAFE_PROTOCOL_REGEX = /^https?:/i;

export const getProjectLinkHref = (link?: string) => {
  const value = link?.trim();
  if (!value) return null;

  if (SAFE_PROTOCOL_REGEX.test(value)) {
    return value;
  }

  if (ABSOLUTE_PROTOCOL_REGEX.test(value)) {
    return null;
  }

  return `https://${value}`;
};

export const getProjectLinkLabel = (
  project: Pick<Project, "link" | "linkLabel">,
  options?: { preferFullUrl?: boolean }
) => {
  const customLabel = project.linkLabel?.trim();
  if (customLabel) return customLabel;

  const originalLink = project.link?.trim();
  if (!originalLink) return "";

  if (options?.preferFullUrl) {
    return originalLink;
  }

  const href = getProjectLinkHref(originalLink);
  if (!href) return originalLink;

  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return originalLink;
  }
};

export const getProjectLinkMeta = (
  project: Pick<Project, "link" | "linkLabel">,
  options?: { preferFullUrl?: boolean }
) => {
  const href = getProjectLinkHref(project.link);
  if (!href) return null;

  return {
    href,
    label: getProjectLinkLabel(project, options),
    title: project.link?.trim() || href,
  };
};
