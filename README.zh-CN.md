<div align="center">

# ✨ Magic Resume ✨

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-black)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.0-purple)

<a href="https://trendshift.io/repositories/13077" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13077" alt="Magic Resume | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>


简体中文 | [English](./README.md)

</div>

Magic Resume 是一个现代化的在线简历编辑器，让创建专业简历变得简单有趣。基于 TanStack Start 和 Motion 构建，支持实时预览和自定义主题。

## 📸 项目截图

<img width="1920" height="1440" alt="85_1x_shots_so" src="https://github.com/user-attachments/assets/4667e49a-7bf2-4379-9390-725e42799dc7" />


## ✨ 特性

- 🚀 基于 TanStack Start 构建
- 💫 流畅的动画效果 (Motion)
- 🎨 自定义主题支持
- 🌙 深色模式
- 📤 导出为 PDF
- 🔄 实时预览
- 💾 自动保存
- 🔒 硬盘级存储

## 🛠️ 技术栈

- TanStack Start
- TypeScript
- Motion
- Tiptap
- Tailwind CSS
- Zustand
- Shadcn/ui
- Lucide Icons

## 🚀 快速开始

1. 克隆项目

```bash
git clone git@github.com:JOYCEQL/magic-resume.git
cd magic-resume
```

2. 安装依赖

```bash
pnpm install
```

3. 启动开发服务器

```bash
pnpm dev
```

4. 打开浏览器访问 `http://localhost:3000`

### OrcaRouter（可选 AI 服务商）

在「AI 服务商」中选择 OrcaRouter，通过 [Magic Resume 专属推荐链接](https://www.orcarouter.ai/ref/ref_54dd337f5d343624a551) 注册，随后使用 OrcaRouter 登录授权或填写自己的 API Key。获取模型列表后，选择模型并检测连接。

该链接属于合作推荐链接，通过它注册并产生符合合作规则的消费，Magic Resume 可能获得分成。你可以自由选择其他服务商。OAuth 登录也携带同一个推荐码，用于授权流程中的新用户注册归因。

应用用量归因与注册推荐归因是两项配置。部署者需从合作后台 Integration 页取得真实 `app_id`，在构建时设置 `VITE_ORCA_APP_ID`，并登记与部署地址一致的回调 URL，例如 `https://magicv.art/auth/orcarouter/callback`。本地调试使用 `http://localhost:3000/auth/orcarouter/callback`。未配置 `app_id` 时不会声明已启用应用用量归因；不要将 API Key 填入此变量。详见 [OrcaRouter 合作应用文档](https://docs.orcarouter.ai/getting-started/sign-in-with-orcarouter#verified-apps-partners)。

配置位置：本地开发在 `.env.local` 中设置 `VITE_ORCA_APP_ID` 后重启开发服务；GitHub Actions 在仓库 **Settings → Secrets and variables → Actions → Variables** 中设置同名变量，Cloudflare 和 Docker 发布流程都会在构建时读取。Docker Compose 会从 shell 或 `.env` 读取同名构建参数；直接构建可使用 `docker build --build-arg VITE_ORCA_APP_ID="$VITE_ORCA_APP_ID" -t magic-resume .`。该值需要写入前端产物，仅给运行中的容器增加环境变量不会生效。未拿到真实值时保持未配置。

## 📦 构建打包

```bash
pnpm build
```

### AI 厂商网络配置

Cloudflare Workers 使用平台原生 `fetch`，无需配置应用层代理。Node.js 或 Docker 部署在无法直连 OpenAI、Gemini、Anthropic 的地区时，可以设置 `AI_PROXY_URL`；同时兼容 `HTTPS_PROXY` 和 `HTTP_PROXY`。

```bash
AI_PROXY_URL=http://127.0.0.1:7890
```

DeepSeek、通义千问和豆包保持直连。

## 🐳 Docker 部署

### Docker Compose

1. 确保你已经安装了 Docker 和 Docker Compose

2. 在项目根目录运行：

```bash
docker compose up -d
```

这将会：

- 自动构建应用镜像
- 在后台启动容器



## 📝 许可协议与使用限制

本项目源代码基于 **Apache 2.0** 协议发布，并附带**仅限非商业使用**的额外限制：

- **个人免费**：仅限个人非商业目的（如个人学习交流、制作个人简历）免费使用。
- **禁止商用**：不得将本项目用于任何商业目的，包括将其作为收费或营利性服务（如 SaaS/PaaS）对外提供、用于企业商业运营、转售或进行二次商业化开发，**无论是否修改源代码**。

详情请查看 [LICENSE](LICENSE) 文件。

## 🗺️ 路线图

- [x] AI 辅助编写
- [x] 多语言支持
- [ ] 支持更多简历模板
- [x] 更多格式导出
- [x] 自定义模型
- [x] 自动一页纸
- [x] 导入 PDF, Markdown 等
- [ ] 在线简历托管

## 📈 Star History

<a href="https://star-history.com/#JOYCEQL/magic-resume&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
 </picture>
</a>

## 📞 联系方式

可以通过以下方式关注最新动态:

- 作者：SiYue
- X: @GuangzhouY81070
- Discord: 欢迎加入群组 https://discord.gg/9mWgZrW3VN
- 邮箱：18806723365@163.com
  

- 项目主页：https://github.com/JOYCEQL/magic-resume

## 🌟 支持项目

<img src="https://github.com/JOYCEQL/picx-images-hosting/raw/master/pintu-fulicat.com-1741081632544.26lmg2uc2m.webp" width="320"  alt="图片描述">

## ❤️ 赞助名单

<div align="center">
  <h3>Sponsors</h3>
  <p>如果您赞助了本项目，但没展示在这里，请联系我。</p>
  <p>
    <a href="https://github.com/yj147">
      <img src="https://github.com/yj147.png?size=40" width="40" height="40" alt="@yj147" />
    </a>
    <a href="https://github.com/someone1128">
      <img src="https://github.com/someone1128.png?size=40" width="40" height="40" alt="@someone1128" />
    </a>
    <!-- 在这里继续添加赞助者：
    <a href="https://github.com/<username>">
      <img src="https://github.com/<username>.png?size=40" width="40" height="40" alt="@<username>" />
    </a>
    -->
  </p>
</div>
