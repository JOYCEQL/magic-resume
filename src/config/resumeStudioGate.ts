export const isResumeStudioEnabled = (
  isDevelopment: boolean,
  explicitValue?: string,
) => isDevelopment || explicitValue === "true";
