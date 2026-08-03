# Magic Resume Agent 交接说明

> 面向后续开发 Agent：先读本文件，再按“关键文件地图”阅读源码。目标是在不依赖旧会话上下文的前提下，安全、准确地继续开发 Magic Resume 的原生垂直简历 Agent。

## 1. 项目与当前分支

- 仓库：`Jiandao303/magic-resume`（Fork 自 `JOYCEQL/magic-resume`）
- 当前功能分支：`feat/opencode-zen-provider`
- 本地项目目录：`D:\work file\github\magic-resume`
- 本地访问地址：`http://localhost:3001/app/dashboard/resume-agent`
- 当前状态：原生 Resume Agent 纵向闭环已完成并通过 Docker 构建验收，但本轮原生 Agent 改动尚未 commit/push。
- 默认运行只启动 Web；OpenCode sidecar 已移入 `legacy-opencode` profile，不是默认依赖。

## 2. 最高优先级架构约定

1. Resume Agent 的产品主路径必须是 Magic Resume 内置原生 Runtime。
2. 可以研究 OpenCode 的 Agent loop、工具协议、事件流、状态机、重试、终止和轨迹展示，但不要把 OpenCode sidecar 恢复为默认运行路径。
3. Career Ops 作为工作流与规则来源，不作为第二简历存储、不嵌入其页面、不在运行时调用其 CLI。
4. Magic Resume 是唯一正式简历存储、编辑和渲染中心。
5. 模型思维链默认不展示；用户可在执行轨迹里显式开启（`exposeReasoning`）。开启后思考原文写入 Job 的 `modelCalls` 并下发 `model.reasoning` 事件；未开启时不采集、不持久化、不下发。**本条于 2026-07-31 修订**：原条款为「不展示模型私有思维链」，因用户明确要求「思维链直接输出模型思考的过程」而放开，保留默认关闭以兼顾隐私与存储体积。
6. 不要把 API Key 写入 Job、Checkpoint、日志、localStorage 之外的自建服务端文件，或任何测试数据。
7. 所有网络 JD 读取必须经过 SSRF 防护：HTTPS-only、DNS/IP 私网拒绝、重定向限制、Content-Type 与大小限制。唯一例外是 `RESUME_AGENT_SEARXNG_URL`：它来自部署方环境变量而非用户输入，允许指向内网自托管实例。
8. 模型可以在「岗位调研」子阶段自主选择工具（`agent-loop.ts`），但不得决定工作流。事实门禁、简历定制、用户确认仍由 `runner.ts` 按固定顺序执行；循环受迭代次数、工具调用次数、时间三重预算约束，任一触顶即停止并回退确定性调研路径。**本条于 2026-07-31 新增**：原约定为「模型是受控生成节点，不决定工作流」，现放宽为「不决定工作流，但可在受限子阶段自主选工具」。
9. 循环暴露给模型的工具必须是只读白名单，不含写操作、本地文件访问或任何能修改简历存储的能力。

## 3. 当前业务主流程

```text
用户自然语言输入
→ POST /api/resume-agent/jobs 创建原生 Job
→ candidate_facts 候选人事实提取
→ target_definition 目标岗位定义
→ job_discovery 模型自主调研循环（工具白名单 + 三重预算）
      └─ 失败或无产出时回退：用户 URL → ATS 发现 → Web 搜索兜底 → 用户粘贴的 JD
→ job_research 多 JD 抓取/提取/去重
→ jd_analysis ATS 关键词
→ career_ops_evaluation 技能差距、证据排序、招聘者风险
→ resume_tailoring 受控模型定制草稿
→ fact_gate 事实门禁
→ user_confirmation 等待用户确认 + 结构化澄清计划 pendingQuestions
→ POST /jobs/:id/answer 用户作答（回退 tailoring/fact_gate 重跑，不重复调研）
→ POST /jobs/:id/confirm 服务端硬校验
→ ResumeDraft → ResumeData
→ addResume()
→ /app/workbench/:id
```

关键点：生成成功不自动完成，必须停在 `waiting_user`；只有用户确认且 `validateResumeDraft().canSave === true` 才能进入 `completed`。

## 4. 关键文件地图

### 数据合同

- `src/types/resume-agent.ts`
  - `ResumeDraft`
  - `ResumeAgentJob`
  - `ResumeAgentWorkflowCheckpoint`
  - `CandidateFact`
  - `JobResearchBundle`
  - `CareerOpsEvaluation`
  - `ResumeAgentJobEvent`
  - `ResumeAgentRuntime = "native" | "opencode" | "direct"`

### 原生 Runtime 服务端

- `src/lib/server/resume-agent/runner.ts`
  - 创建/执行/取消/恢复/作答 Job。
  - Checkpoint v3：`completedSteps`、`factIssues`、`pendingQuestions`、`answeredQuestions`。
  - 失败/超时/取消后按已完成步骤恢复。
  - `answerResumeAgentQuestions()`：把澄清答案追加为用户消息，回退 `resume_tailoring` / `fact_gate` 两步重跑，保留调研结果。
- `src/lib/server/resume-agent/agent-loop.ts`
  - 模型驱动的调研工具循环，OpenAI 兼容 function calling。
  - 三重预算：`RESUME_AGENT_LOOP_MAX_ITERATIONS` / `_MAX_TOOL_CALLS` / `_BUDGET_MS`。
  - 只读工具白名单；工具失败不终止循环，模型据此换来源。
- `src/lib/server/resume-agent/clarification.ts`
  - 把 `missingFields` / `followUpQuestions` / `conflicts` 结构化为可点选的 `pendingQuestions`。
  - severity 分类必须与 `utils/resumeAgent.ts` 的 `validateResumeDraft` 一致，否则会出现「答完仍不能保存」。
- `src/lib/server/resume-agent/web-search.ts`
  - 自托管 SearXNG JSON API；未配置 `RESUME_AGENT_SEARXNG_URL` 时返回 `configured:false`，工作流写入 limitations 而非伪装成搜过。
- `src/lib/server/resume-agent/job-repository.ts`
  - JSON 本地持久化，默认目录 `.data/resume-agent`，容器内 `/app-data/resume-agent`。
  - 原子写入、串行队列、每 Job 最多 1000 事件。
- `src/lib/server/resume-agent/tool-registry.ts`
  - 原生领域工具注册表，按阶段限制工具。9 个工具（含 `resume_web_search`）。
- `src/lib/server/resume-agent/career-ops.ts`
  - ATS 关键词、技能差距、角色相似度、文本指纹、存活判断、来源可信度、事实校验。
- `src/lib/server/resume-agent/ats-providers.ts`
  - Greenhouse、Lever、Ashby 公共岗位发现。
- `src/lib/server/resume-agent/security.ts`
  - 公开 URL 安全读取。
- `src/lib/server/resume-agent/model-adapter.ts`
  - 受控生成节点，不决定工作流；429/5xx 与 JSON 解析失败均有限重试。
  - `stripReasoningBlocks` 剥离 `<think>`；`extractBalancedJson` 用括号配对定位 JSON（不能用贪婪正则）。
  - 解析失败时把 `rawExcerpt` 挂在 error 上，供轨迹展示原始输出片段。

### API

- `POST src/routes/api/resume-agent/jobs.ts`
- `GET src/routes/api/resume-agent/jobs/$id.ts`
- `GET src/routes/api/resume-agent/jobs/$id/events.ts?after=sequence`
- `POST src/routes/api/resume-agent/jobs/$id/cancel.ts`
- `POST src/routes/api/resume-agent/jobs/$id/resume.ts`
- `POST src/routes/api/resume-agent/jobs/$id/answer.ts`
- `POST src/routes/api/resume-agent/jobs/$id/confirm.ts`

旧兼容入口：`src/routes/api/resume-agent.ts`，保留 OpenCode legacy fallback，不是默认前端路径。

### 前端

- `src/app/app/dashboard/resume-agent/page.tsx`
  - 容器：布局、Job 轮询、提交、作答、保存。
  - Job polling 每 800ms；浏览器等待上限 240 秒。
  - 失败/超时/取消后「重试」调用原 Job 的 `/resume`，不再创建新 Job。
  - 保存前调用 `/confirm`。
- `src/app/app/dashboard/resume-agent/components/`
  - `AgentTraceBlock` 左侧可整体折叠的执行块 + 思考过程开关。
  - `AgentTimeline` / `AgentStepItem` / `AgentStepIcon` 流式步骤树，支持嵌套、耗时、状态图标。
  - `AgentClarificationPlan` plan mode 式澄清面板。
  - `AgentSidePanel` 可拖拽收起的右侧栏 + Tabs（草稿 / 轨迹 / 工具）。
  - `AgentDraftPanel` / `AgentTracePanel` / `AgentQuickToolsPanel` 三个 Tab 内容。
  - `useSidePanelResize` Pointer Events 拖拽；`useLiveClock` running 步骤共享 1s tick。
- `src/store/useResumeAgentTimelineStore.ts` Job 事件 → 步骤树；`useResumeAgentLayoutStore.ts` 侧栏宽度/折叠持久化（`skipHydration` + 手动 rehydrate）。
- `src/types/resume-agent-ui.ts` UI 层类型（`AgentTimelineStep` 等）。

### Docker

- `Dockerfile.local`
- `docker-compose.yml`
- 数据卷：`resume-agent-data:/app-data`
- 默认启动：

```bash
docker compose build web
docker compose up -d web
```

- legacy OpenCode 只在明确迁移对照时启动：

```bash
docker compose --profile legacy-opencode up -d
```

## 5. 当前已实现能力

- 五类模型服务商：Doubao、DeepSeek、OpenAI Compatible、Gemini、OpenCode Zen。
- 原生后台 Job、事件序列、Checkpoint、取消、恢复、作答、确认门禁。
- 用户提供 JD URL 的受控读取。
- 根据目标公司/岗位主动查询 Greenhouse、Lever、Ashby。
- 通用 Web 搜索（自托管 SearXNG，需配 `RESUME_AGENT_SEARXNG_URL`）。
- 模型自主选工具的调研循环，受三重预算约束并可回退确定性路径。
- 多 JD 指纹去重。
- ATS 关键词、技能差距、证据排序、招聘者风险、事实门禁。
- 结构化澄清计划（plan mode 式选项 + 自由文本 + 「暂不提供」）。
- 可选的模型思考过程展示，默认关闭。
- API Key 不进入 Job/Checkpoint 持久化。
- 候选人证据开始绑定用户消息 ID。
- 前端：流式嵌套执行步骤（状态图标 + 耗时 + 逐级折叠）、可拖拽收起的右侧栏 Tabs、停止/重试、模板预览、入库跳转。

## 6. 当前验收结果

最近最终验收（2026-07-31，第二轮改造后）：

- Vite client build：通过。
- Vite SSR build：通过。
- Docker image `magic-resume:local-agent`：通过。
- `/app/dashboard/resume-agent`：HTTP 200。
- 空 Job 请求：HTTP 400。
- 容器日志：仅 `Server running at http://0.0.0.0:3000`。
- `docker compose config --quiet`：通过。
- `git diff --check`：通过。
- 未发现硬编码 API Key。

已知非阻塞警告：项目原有 `DEFAULT_TEMPLATES` 循环 re-export、大 chunk 提示。

`tsc --noEmit` 全量仍有既有错误（Next.js 残留导入、`magicui`、`preview` 等），以及 `tsconfig.json` 缺 `target` 导致的 `Set`/`Map` 迭代与 BigInt 报错。Vite 走 esbuild 不读 tsc 的 `target`，故不影响构建；改 `target` 会波及全仓库，属独立决策，未在本轮处理。

**尚未验证**：真实模型下的端到端行为。调研循环、思考过程采集、澄清作答重跑都只通过构建与静态检查，没有跑过一次带有效 API Key 的完整 Job。

## 7. 当前未完成/建议下一步

优先级建议从高到低：

1. 使用有效模型配置建立 Golden Cases，覆盖：
   - 短输入；
   - 丰富输入；
   - 单个 JD URL；
   - 多个 JD URL；
   - ATS 自动发现；
   - 模型自主调研循环（有/无 SearXNG 两种配置）；
   - 不支持 function calling 的模型走回退路径；
   - 失效岗位；
   - 技能缺口；
   - 量化成果无证据；
   - 冲突事实；
   - 澄清作答后重跑（含「暂不提供」）；
   - 思考过程开关的开/关两种状态；
   - 超时/取消后恢复；
   - 用户确认后入库与工作台跳转。
2. 公司六维深度研究：
   - AI 战略；
   - 最近六个月动态；
   - 工程文化；
   - 潜在挑战；
   - 竞争对手；
   - 候选人切入角度。
3. 扩展岗位来源：
   - Workday；
   - BambooHR；
   - Teamtailor；
   - Breezy；
   - 公司官网招聘页；
   - 受控 Playwright SPA 抓取。
   （通用 Web Search Adapter 已完成，见 `web-search.ts`。）
4. 将事件 polling 升级为 SSE，同时保留 sequence 增量恢复。
5. Candidate Fact Store 继续增强：
   - 保存字段真实值；
   - 更精确绑定 `sourceMessageIds`；
   - 用户纠正、冲突、拒绝、版本历史；
   - 每个 ResumeDraft 字段绑定证据 ID。
6. 后续求职生命周期：
   - Cover Letter；
   - Application Questions；
   - Tracker；
   - Interview Plan；
   - Mock Interview；
   - Follow-up；
   - Offer Preparation。
7. 公网多用户前必须补齐：
   - 账号系统；
   - 服务端数据库；
   - 租户隔离；
   - API Key 加密与隔离；
   - 配额、限流、审计、安全日志。

## 8. 开发操作守则

- 修改前先运行：`git status --short --branch`、`git diff --check`。
- 修改后至少运行：`docker compose build web`；必要时 `docker compose up -d web` 并验证 HTTP。
- 不要把 `.data/`、`node_modules/`、`dist/`、`.learnings/`、本地测试 Job 或任何密钥提交。
- `Dockerfile.local` 目前在 `.gitignore` 中，是本地开发构建文件；如果决定正式纳入版本控制，需要团队确认。
- `THIRD_PARTY_NOTICES` 必须随 Resume Agent 相关实现保留。
- Magic Resume 自身许可证含商业限制；不要将项目错误描述为无限制 Apache-2.0。

## 9. 记忆文件位置

WorkBuddy 的辅助记忆在当前工作区外部：

- 长期项目约定：`D:\work file\github\.workbuddy\memory\MEMORY.md`
- 日期日志：`D:\work file\github\.workbuddy\memory\2026-07-31.md`

这些文件是补充上下文；仓库内以本 `AGENTS.md` 为交接入口。

## 10. 给下一位 Agent 的最短执行建议

1. 读本文件。
2. 读 `src/types/resume-agent.ts`。
3. 读 `src/lib/server/resume-agent/runner.ts` 和 `tool-registry.ts`。
4. 读 `src/app/app/dashboard/resume-agent/page.tsx`。
5. 运行 Git 状态与 Docker 构建验证。
6. 从“当前未完成/建议下一步”的最高优先级开始，不要重建架构，不要把 OpenCode 恢复为默认路径。
