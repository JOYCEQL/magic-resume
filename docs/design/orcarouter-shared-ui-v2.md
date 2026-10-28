# OrcaRouter 授权入口设计 v2

本版依据用户反馈，直接以当前 DeepSeek 页面为参考，沿用所有服务商的共同布局，重点调整授权入口。上一版独立布局不再作为本轮方案。

配套设计图：`orcarouter-shared-ui-v2.png`。本版已按用户确认实现。

实际页面截图：`orcarouter-shared-ui-implemented.png`；手机截图：`orcarouter-shared-ui-mobile.png`。

- 保留顶部文字助手和 PDF 解析分配卡片。
- 保留左侧服务商列表、右侧服务商标题和全宽 API 密钥输入框。
- 在右侧标题栏的「获取密钥」旁添加紧凑主按钮「授权连接」。
- 登录授权成功后自动填入密钥并拉取模型；手填密钥仍可使用「获取模型列表」。
- 模型区使用短提示行展示未获取状态，授权操作不占独立大块区域。
- 已授权状态继续使用同一密钥输入框，默认隐藏密钥，附有「已授权」状态与管理链接。
- 只有成功完成授权回调后才将凭据标记为 OAuth；取消或拒绝授权保留原有手填密钥。

生成方式：内置 ImageGen，参考当前 DeepSeek 页面截图进行局部编辑。

## 最终提示词

```text
Use case: ui-mockup. Make a precise localized UI edit of the supplied ACTUAL DeepSeek settings screenshot to show OrcaRouter UNAUTHORIZED settings in the SAME application UI. User specifically rejects a separate redesigned layout: all providers must share the same UI. Treat the supplied screenshot as authoritative: preserve global navigation, title AI 模型, the two top assignment cards 文字助手 and PDF 解析 in their exact locations, provider sidebar dimensions, large provider panel, existing neutral colors, typography, borders, corner radii and spacing. Output the same wide desktop composition as reference with crisp Chinese text. Do not redesign the page or move sections.

Changes only inside provider selection and provider detail:
1. Select OrcaRouter in left provider rail with the exact same white selected-row styling and checkmark currently used by DeepSeek. DeepSeek becomes unselected. Change right provider heading/icon from DeepSeek to OrcaRouter.
2. The key focus is a BEAUTIFULLY EXECUTED COMPACT AUTHORIZATION BUTTON. In the provider panel header's upper right, beside the existing quiet outlined 获取密钥 external-link button, add a charcoal filled primary button labelled 授权连接 with a small login/arrow icon. Both buttons have identical height about 36-40 CSS pixels, 8px corner radii, precisely centered typography, 10px gap. Authorization button is about 112px wide, solid near-black, light text, subtle one-pixel highlight, no gradients or colored glow. Put 授权连接 at far right, 获取密钥 immediately to its left. Its placement and contrast make this the obvious primary action without taking over the page.
3. Keep the API 密钥 label and full-width password input exactly like other providers. Placeholder 填入该厂商的 API Key, eye icon at the right. Below it add just one short quiet helper line 授权后自动填入密钥，也可手动填写. No extra account connection title, no separate login block, no OR divider, no full-width black CTA.
4. Keep 可用模型 header, gray small badge 尚未获取, and right-aligned outlined 获取模型列表 button in the same layout as reference. Fetch button visibly disabled until a key is present. Replace DeepSeek's sample cards with a compact left-aligned thin bordered neutral hint row only 72 CSS pixels tall, text 授权连接或填写密钥后，获取可用模型. No giant empty-state illustration, no fake models, no giant centered message, no spinner.
5. Keep both top assignment cards unchanged and unassigned. Keep all providers shown. Keep global left nav AI服务商 active.
6. Remove the small floating developer toolbar at bottom. Add a tiny unobtrusive caption 设计稿 · 未授权 at top-right of page if space allows.

Essential: this must look almost identical to the original shared provider form, with ONLY OrcaRouter-specific compact authorization button added. Respect shared visual language. No new green selected card design, no data table, no moved assignment controls, no onboarding screen, no new UI sections.
```
