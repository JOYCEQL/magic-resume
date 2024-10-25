/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-normalize": {
      // 配置选项
      allowDuplicates: false, // 不允许重复导入
      forceImport: true // 强制导入所有规范化样式
    },
    tailwindcss: {}
  }
};

export default config;
