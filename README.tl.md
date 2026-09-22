<div align="center">

# ✨ Magic Resume ✨

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-black)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.0-purple)

<a href="https://trendshift.io/repositories/13077" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13077" alt="Magic Resume | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

[简体中文](./README.zh-CN.md) | [English](./README.md) | Filipino

</div>

Ang Magic Resume ay isang modernong online resume editor na ginagawang simple at masaya ang paglikha ng propesyonal na resume. Binuo gamit ang TanStack Start at Framer Motion, may suporta sa real-time preview at custom themes.

## 📸 Mga Screenshot

<img width="1920" height="1440" alt="336_1x_shots_so" src="https://github.com/user-attachments/assets/18969a17-06f8-4a4b-94eb-284ba8442620" />


## ✨ Mga Feature

- 🚀 Binuo gamit ang TanStack Start
- 💫 Makinis na animation (Framer Motion)
- 🎨 Suporta sa custom theme
- 📱 Responsive design
- 🌙 Dark mode
- 📤 I-export sa PDF
- 🔄 Real-time preview
- 💾 Auto-save
- 🔒 Lokal na imbakan
- 🌐 Multi-language UI (中文, English, Filipino)

## 🌐 Mga Wika

Sinusuportahan ng Magic Resume ang tatlong locale. Magpalit ng wika sa header, o buksan nang direkta ang locale:

| Locale | Wika | URL |
| ------ | ---- | --- |
| `zh` | 中文 (default) | `/zh` |
| `en` | English | `/en` |
| `tl` | Filipino / Tagalog | `/tl` |

Nasa [`src/i18n/locales/`](src/i18n/locales/) ang mga translation. Para magdagdag o mag-update ng string, i-edit ang katumbas na JSON file (halimbawa `tl.json` para sa Filipino).

## 🛠️ Tech Stack

- TanStack Start
- TypeScript
- Motion
- Tiptap
- Tailwind CSS
- Zustand
- Shadcn/ui
- Lucide Icons

## 🚀 Mabilis na Pagsisimula

1. I-clone ang proyekto

```bash
git clone git@github.com:JOYCEQL/magic-resume.git
cd magic-resume
```

2. I-install ang mga dependency

```bash
pnpm install
```

3. Simulan ang development server

```bash
pnpm dev
```

4. Buksan ang browser at bisitahin ang `http://localhost:3000` (awtomatikong magre-redirect sa `/zh` bilang default, o subukan ang `/en` at `/tl`)

## 📦 Build at Deploy

```bash
pnpm build
```


## 🐳 Docker Deployment

### Docker Compose

1. Siguraduhing naka-install ang Docker at Docker Compose

2. Patakbuhin ang sumusunod na command sa root directory ng proyekto:

```bash
docker compose up -d
```

Ito ay:

- Awtomatikong bubuo ng application image
- Magsisimula ng container sa background


## 📝 Lisensya at Komersyal na Paggamit

Ang source code ng proyektong ito ay open-source sa ilalim ng **Apache 2.0** license, ngunit may **mahigpit na restriksyon sa komersyal na paggamit**:

- **Libre para sa Personal na Paggamit**: Libre gamitin para sa personal at hindi komersyal na layunin (hal., personal na pag-aaral, paggawa ng sariling resume).
- **Kailangan ng Komersyal na Lisensya**: Mahigpit na ipinagbabawal ang hindi awtorisadong komersyal na paggamit. Anumang organisasyon o indibidwal na mag-aalok nito bilang serbisyo (SaaS/PaaS, atbp.) sa publiko para kumita, gagamitin ito para sa enterprise commercial operations, o magsasagawa ng secondary commercial development, **dapat kumuha ng komersyal na lisensya, kahit binago man ang source code**.

Pakitingnan ang [LICENSE](LICENSE) file para sa detalyadong mga tuntunin.

## 🗺️ Roadmap

- [x] AI-assisted writing
- [x] Multi-language support (中文, English, Filipino)
- [ ] Suporta sa mas maraming resume template
- [ ] Suporta sa mas maraming export format
- [ ] Mag-import ng PDF, Markdown, atbp.
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

## 📞 Makipag-ugnayan

Maaari mong sundan ang pinakabagong update sa pamamagitan ng:

- Author: Siyue
- X: @GuangzhouY81070
- Discord: Sumali sa aming community https://discord.gg/9mWgZrW3VN
- Email: 18806723365@163.com


- Project Homepage: https://github.com/JOYCEQL/magic-resume

## 🌟 Suporta

Kung nakatulong sa iyo ang proyektong ito, magbigay ng star ⭐️

## ❤️ Mga Sponsor

<div align="center">
  <h3>Sponsors</h3>
  <p>Kung nag-sponsor ka sa proyektong ito ngunit wala ka rito, makipag-ugnayan sa akin.</p>
  <p>
    <a href="https://github.com/yj147">
      <img src="https://github.com/yj147.png?size=40" width="40" height="40" alt="@yj147" />
    </a>
    <a href="https://github.com/someone1128">
      <img src="https://github.com/someone1128.png?size=40" width="40" height="40" alt="@someone1128" />
    </a>
    <!-- Magdagdag ng mas maraming sponsor dito:
    <a href="https://github.com/<username>">
      <img src="https://github.com/<username>.png?size=40" width="40" height="40" alt="@<username>" />
    </a>
    -->
  </p>
</div>
