# OrcaRouter 未授权态设计提案

生成方式：内置 ImageGen，以上一版已连接态设计图为参考编辑。

配套图片：`orcarouter-unauthorized-concept-2026-10-29.png`。

## 交互

- 首次进入：未连接状态，显示登录授权与 API Key 两条路径。
- 登录授权：完成后返回设置并自动获取模型列表。
- 手填密钥：输入为空时获取按钮禁用，填入后可主动获取。
- 模型区始终可见，未获取时显示操作指引，不展示虚构模型或加载骨架。
- 没有已添加模型时，文字助手和 PDF 解析显示不可选择的占位提示。
- 此图展示首次未授权状态；已有其他服务商模型时，功能分配仍应可用。

本文件与配套图片仅为设计提案，未更改页面实现。

## 最终生成提示词

```text
Use case: ui-mockup. Edit the provided Magic Resume AI settings design into its matching FIRST VISIT / NOT AUTHORIZED state. Preserve the app shell, logo 魔方简历, typography, light neutral palette, provider sidebar width and selected OrcaRouter, overall layout and crisp high-fidelity desktop product design. Output one polished desktop screen approximately 1600x1000. This must be a coherent companion to the reference, not a design board. Chinese UI text must be legible.

Change the selected provider status to a gray dot and 未连接. Change main OrcaRouter header badge to 未连接 and top-right action to 获取密钥 with external link icon. Remove all masked credentials, connected success badges, sample models, update timestamps and assignments. Top-right tiny caption 设计提案 · 未授权.

Under main header, create a compact but inviting connection area. Heading 连接 OrcaRouter with one line 登录并授权后，即可获取可用模型. A normal-width charcoal primary button 使用 OrcaRouter 登录 with a small arrow icon (not full panel width). Under it use a quiet divider with 或使用 API Key. A labelled API Key input, placeholder 粘贴你的 OrcaRouter API Key, trailing eye icon, and a compact outlined button 获取模型列表 to the right. This fetch button is currently visibly disabled because input is empty, but remains discoverable. Small helper text 已有密钥？填写后点击获取模型列表. This presents two clear alternatives: authorization automatically fetches, or manual key and fetch.

Below a thin divider keep a section titled 模型列表 with a small gray badge 尚未获取. Search is omitted until there are models. Replace all model rows with a compact, beautifully aligned empty state of about 160px height inside a faint neutral border: small simple list icon, heading 连接后查看可用模型, secondary text 先登录授权，或填写 API Key 获取模型列表. No fake models and no loading skeleton because no request is in progress.

Below, keep 功能分配 with two compact side-by-side fields, labelled 文字助手 and PDF 解析, each with disabled dropdown placeholder 请先添加模型. Tiny note 支持图片输入的模型可用于 PDF 解析. Bottom small muted privacy note 配置仅保存在当前浏览器.

Retain same sidebar provider names and icons as reference. Make connection area primary and task assignment secondary. All controls precisely aligned, disciplined spacing, no huge empty canvas, no oversized icons or huge login button, no gradients, no dark mode, no nested card pile. No green connected indicators anywhere in this first-use state. The result must feel like a real elegant product settings screen.
```
