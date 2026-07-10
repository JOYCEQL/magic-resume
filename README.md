<div align="center">

# ✨ Magic Resume ✨

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-black)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.0-purple)

<a href="https://trendshift.io/repositories/13077" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13077" alt="Magic Resume | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[简体中文](./README.zh-CN.md) | English | [Filipino](./README.tl.md)

</div>

Magic Resume is a modern online resume editor that makes creating professional resumes simple and enjoyable. Built with TanStack Start and Framer Motion, it supports real-time preview and custom themes.

## 📸 Screenshots

<img width="1920" height="1440" alt="336_1x_shots_so" src="https://github.com/user-attachments/assets/18969a17-06f8-4a4b-94eb-284ba8442620" />


## ✨ Features

- 🚀 Built with TanStack Start
- 💫 Smooth animations (Framer Motion)
- 🎨 Custom theme support
- 📱 Responsive design
- 🌙 Dark mode
- 📤 Export to PDF
- 🔄 Real-time preview
- 💾 Auto-save
- 🔒 Local storage
- 🌐 Multi-language UI (中文, English, Filipino)

## 🌐 Languages

Magic Resume supports three locales. Switch languages from the header, or open a locale directly:

| Locale | Language | URL |
| ------ | -------- | --- |
| `zh` | 中文 (default) | `/zh` |
| `en` | English | `/en` |
| `tl` | Filipino / Tagalog | `/tl` |

Translations live in [`src/i18n/locales/`](src/i18n/locales/). To add or update strings, edit the matching JSON file (for example `tl.json` for Filipino).

## 🛠️ Tech Stack

- TanStack Start
- TypeScript
- Motion
- Tiptap
- Tailwind CSS
- Zustand
- Shadcn/ui
- Lucide Icons

## 🚀 Quick Start

1. Clone the project

```bash
git clone git@github.com:JOYCEQL/magic-resume.git
cd magic-resume
```

2. Install dependencies

```bash
pnpm install
```

3. Start development server

```bash
pnpm dev
```

4. Open browser and visit `http://localhost:3000` (redirects to `/zh` by default, or try `/en` and `/tl`)

## 📦 Build and Deploy

```bash
pnpm build
```

### AI provider networking

Cloudflare Workers use the platform's native `fetch` and do not need an application-level proxy. For Node.js or Docker deployments in regions that cannot directly reach OpenAI, Gemini, or Anthropic, set `AI_PROXY_URL`. `HTTPS_PROXY` and `HTTP_PROXY` are also supported as fallbacks.

```bash
AI_PROXY_URL=http://127.0.0.1:7890
```

DeepSeek, Qwen, and Doubao continue to use a direct connection.


## 🐳 Docker Deployment

### Docker Compose

1. Ensure you have Docker and Docker Compose installed

2. Run the following command in the project root directory:

```bash
docker compose up -d
```

This will:

- Automatically build the application image
- Start the container in the background


## 📝 License and Usage Restrictions

The source code of this project is released under the **Apache 2.0** license with an additional **non-commercial use restriction**:

- **Free for Personal Use**: Free to use purely for personal, non-commercial purposes (e.g., personal learning, creating your own resume).
- **Commercial Use Prohibited**: The project may not be used for any commercial purpose, including providing it as a paid or profit-generating service (such as SaaS/PaaS), enterprise commercial operations, resale, or secondary commercial development, **regardless of whether the source code has been modified**.

Please see the [LICENSE](LICENSE) file for detailed terms.

## 🗺️ Roadmap

- [x] AI-assisted writing
- [x] Multi-language support (中文, English, Filipino)
- [ ] Support for more resume templates
- [x] Support for more export formats
- [x] Import PDF, Markdown, etc.
- [x] Custom model
- [x] Auto one page
- [ ] Online resume hosting

## 📈 Star History

<a href="https://star-history.com/#JOYCEQL/magic-resume&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
 </picture>
</a>

## 📞 Contact

You can follow the latest updates via:

- Author: Siyue
- X: @GuangzhouY81070
- Discord: Join our community https://discord.gg/9mWgZrW3VN
- Email: 18806723365@163.com


- Project Homepage: https://github.com/JOYCEQL/magic-resume

## 🌟 Support

If you find this project helpful, please give it a star ⭐️

## ❤️ Sponsors

<div align="center">
  <h3>Sponsors</h3>
  <p>If you sponsored this project but are not listed here, please contact me.</p>
  <p>
    <a href="https://github.com/yj147">
      <img src="https://github.com/yj147.png?size=40" width="40" height="40" alt="@yj147" />
    </a>
    <a href="https://github.com/someone1128">
      <img src="https://github.com/someone1128.png?size=40" width="40" height="40" alt="@someone1128" />
    </a>
    <!-- Add more sponsors here:
    <a href="https://github.com/<username>">
      <img src="https://github.com/<username>.png?size=40" width="40" height="40" alt="@<username>" />
    </a>
    -->
  </p>
</div>
