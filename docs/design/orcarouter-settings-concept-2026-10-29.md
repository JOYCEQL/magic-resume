# OrcaRouter 设置页设计提案

生成方式：内置 ImageGen。参考：2026-10-29 本地 `/app/dashboard/ai?provider=orcarouter` 页面截图。

设计图：`orcarouter-settings-concept-2026-10-29.png`。

这是视觉提案，尚未整体实现。图中的模型、密钥尾号和更新时间均为示例，不代表真实账号数据或实时目录。

## 设计方向

- 保留魔方简历浅色品牌及全局导航，收紧服务商列表。
- 按账户连接、模型列表、功能分配组织内容，突出获取模型列表入口。
- 用可搜索的模型行替代层层嵌套的卡片；让模型能力和当前用途直接可见。
- 连接后展示紧凑状态行；未连接、加载中、失败和空列表也保留模型区。

## 已实现的交互修复

- 获取模型列表按钮和模型区始终显示，未连接时禁用按钮并提供说明。
- 登录后自动拉取目录，切换服务商返回后恢复自动拉取。
- 增加加载和重试文案；刷新时关闭旧下拉列表。
- 搜索支持名称与 ID；模型计数来自兼容目录，不再误用已保存模型数量。
- 窄屏服务商导航横向滚动，配置区不再被固定双栏挤压。

## ImageGen 最终提示词

```text
Use case: ui-mockup. Create one high-fidelity desktop product redesign concept for the Chinese resume builder 魔方简历, AI provider settings /app/dashboard/ai. The input screenshot is reference for existing brand and navigation, not a layout to preserve. Redesign as a polished, calm, highly usable light desktop application, approximately 1600x1000 composition, crisp legible Chinese sans-serif typography, warm near-white canvas, white panels, charcoal text/buttons, fine neutral borders, emerald only for success indicators. Preserve the brand 魔方简历 and four global navigation entries 我的简历 / 简历模板 / AI 服务商 / 通用设置 in a compact 190px sidebar. Heading AI 服务商 with small muted description 连接服务商，为简历选择合适的模型. Main workspace: compact 180px provider rail with OrcaRouter selected, OpenAI / 兼容服务, Gemini, DeepSeek, Claude, 千问 Qwen, 豆包; use subtle rows rather than piled cards. Large right content begins OrcaRouter with a small green 已连接 badge and a quiet 管理授权 link. Account connection section is a compact horizontal row labelled 账户连接, masked credential sk-orca-••••82f1 and actions 更换连接 / 清除. Below, the centerpiece is clearly visible 模型列表 section, count 3 个模型, a prominent 获取模型列表 button with refresh icon, nearby subdued 已更新 hint. Search field 搜索模型名称… and an always-visible clean three-row model list, columns 模型 / 能力 / 操作. Illustrative example rows: GPT-4.1 with id openai/gpt-4.1, Claude Sonnet with id anthropic/claude-sonnet, DeepSeek Chat with id deepseek/deepseek-chat. Capability tags 文字, 图片 only where appropriate. First row selected, subtle light green tint, right status 已用于文字助手, remaining row controls 选择模型. Small caption 模型名称仅为设计示例. Below the catalog add a concise 功能分配 section with two aligned horizontal assignment fields 文字助手 / PDF 解析, both assigned to GPT-4.1 with dropdown chevrons; make these quieter than catalog. Bottom tiny note 配置仅保存在当前浏览器. Every action should look interactive and readable, no gratuitous empty space, no nested card stacks, no huge login button, no purple gradients, no decorative illustrations, no 3D device frame. Add a small unobtrusive top right label 设计提案. This is a visual concept, not an actual screenshot.
```
