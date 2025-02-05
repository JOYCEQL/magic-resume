export const getThemeConfig = () => ({
  bg: "dark:bg-black bg-gray-50",
  sidebar: "dark:bg-zinc-900/50 bg-white",
  text: "dark:text-white text-gray-900",
  textSecondary: "dark:text-zinc-400 text-gray-500",
  border: "dark:border-zinc-800 border-gray-200",
  card: "dark:bg-zinc-800/50 bg-white",
  hover: "dark:hover:bg-zinc-800 hover:bg-gray-100",
  input: "dark:bg-zinc-800/50 dark:border-zinc-700 bg-white border-gray-200",
  button: "dark:bg-zinc-800 bg-white",
  buttonPrimary: "dark:bg-indigo-500 bg-primary",
  preview: "dark:bg-zinc-900 bg-white"
});

export type ThemeConfig = ReturnType<typeof getThemeConfig>;
