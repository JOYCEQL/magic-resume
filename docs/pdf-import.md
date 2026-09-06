# PDF 解析模型配置

在「AI 服务商」页面选择厂商并填写一次 API Key。文字助手与 PDF 解析直接复用这份凭证，无需填写模型 ID 或手动设置图片能力。

每个厂商下展示维护好的内置模型。模型卡会标明 `文字`、`PDF` 能力；填入 Key 后，这些模型会出现在页面顶部对应的选择框中。连接检测按模型执行，PDF 模型会使用测试图片验证视觉输入。

当前内置模型：

| 服务商   | 内置模型                                                |
| -------- | ------------------------------------------------------- |
| OpenAI   | GPT-5.6 Sol、GPT-5.6 Terra、GPT-5.6 Luna                |
| 千问     | Qwen 3.8 Max、Qwen 3.7 Plus、Qwen 3.8 Flash             |
| Gemini   | Gemini 3.8 Flash、Gemini 3.1 Pro、Gemini 3.1 Flash-Lite |
| Claude   | Claude Sonnet 5、Claude Opus 5、Claude Haiku 4.5        |
| DeepSeek | DeepSeek V4 Pro、V4 Flash、V4 Vision                    |
| 豆包     | Doubao Seed 2.1 Pro、Seed 2.0 Lite、Seed 1.6 Vision     |

填完配置后点击「检测连接」。连接正常后，在顶部为文字助手和 PDF 解析分别选择模型，再到「我的简历 → 导入简历 → 导入 PDF」使用。

## 导入范围

- PDF 在浏览器中渲染为页面图片，再发送给所选模型提取结构化简历。
- 最多 10 页，原文件最多 20 MB，请求体最多 16 MB；超过限制会直接提示。
- 不支持加密或损坏的 PDF。
- 创建前会显示识别预览；原 PDF 的版式和照片不会保留。
- 认证失败、限流、模型不支持图片、空结果、非法 JSON 和输出截断都有对应错误提示。

## 验证

使用 Node.js 20.19+ 或 22.12+：

```sh
pnpm test:ai
pnpm build
```

自动测试使用模拟响应，不会调用真实模型。实际识别效果需要配置自己的 Key 后测试。
