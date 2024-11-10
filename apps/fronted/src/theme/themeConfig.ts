export const getThemeConfig = (isDark: boolean) => ({
  bg: isDark ? "bg-black" : "bg-gray-50",
  sidebar: isDark ? "bg-zinc-900/50" : "bg-white",
  text: isDark ? "text-white" : "text-gray-900",
  textSecondary: isDark ? "text-zinc-400" : "text-gray-500",
  border: isDark ? "border-zinc-800" : "border-gray-200",
  card: isDark ? "bg-zinc-800/50" : "bg-white",
  hover: isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100",
  input: isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-white border-gray-200",
  button: isDark ? "bg-zinc-800" : "bg-white",
  buttonPrimary: isDark ? "bg-indigo-500" : "bg-indigo-600",
  preview: isDark ? "bg-zinc-900" : "bg-white"
});

export type ThemeConfig = ReturnType<typeof getThemeConfig>;
