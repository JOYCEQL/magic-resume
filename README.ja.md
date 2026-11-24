<div align="center">

# ✨ Magic Resume ✨

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-black)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.0-purple)

<a href="https://trendshift.io/repositories/13077" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13077" alt="Magic Resume | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://hellogithub.com/repository/JOYCEQL/magic-resume" target="_blank"><img src="https://abroad.hellogithub.com/v1/widgets/recommend.svg?rid=51a0f545d0964a47a173794478119ec7&claim_uid=qMBAYh4ZFCgViJI" alt="Featured｜HelloGitHub" style="width: 250px; height: 54px;" width="250" height="54" /></a>

[简体中文](./README.zh-CN.md) | [English](./README.md) | 日本語

</div>

Magic Resume は、プロフェッショナルな履歴書の作成をシンプルで楽しいものにする、モダンなオンライン履歴書エディターです。TanStack Start と Framer Motion で構築されており、リアルタイムプレビューとカスタムテーマに対応しています。

<p align="center">
  <a href="https://app.offerin.cn/r/aff_Wsk_9WRpwPmN">
    <img src="./images/offerin-banner.png" alt="Sponsored by Offerin AI - AI interview and assessment assistant" width="100%" />
  </a>
</p>

## ❤️ その他のスポンサー

このプロジェクトにスポンサーいただいたにもかかわらずここに掲載されていない場合は、ご連絡ください。

<p align="center">
  <a href="https://github.com/fbitalk"><img src="./images/sponsors/fbitalk.svg" width="64" height="64" alt="@fbitalk" title="@fbitalk" /></a>
  &nbsp;&nbsp;
  <a href="https://github.com/yj147"><img src="./images/sponsors/yj147.svg" width="64" height="64" alt="@yj147" title="@yj147" /></a>
  &nbsp;&nbsp;
  <a href="https://github.com/someone1128"><img src="./images/sponsors/someone1128.svg" width="64" height="64" alt="@someone1128" title="@someone1128" /></a>
</p>

## 📸 スクリーンショット

<img width="1920" height="1440" alt="336_1x_shots_so" src="https://github.com/user-attachments/assets/18969a17-06f8-4a4b-94eb-284ba8442620" />


## ✨ 特長

- 🚀 TanStack Start で構築
- 💫 スムーズなアニメーション（Framer Motion）
- 🎨 カスタムテーマ対応
- 📱 レスポンシブデザイン
- 🌙 ダークモード
- 📤 PDF へのエクスポート
- 🔄 リアルタイムプレビュー
- 💾 自動保存
- 🔒 ローカルストレージ

## 🛠️ 技術スタック

- TanStack Start
- TypeScript
- Motion
- Tiptap
- Tailwind CSS
- Zustand
- Shadcn/ui
- Lucide Icons

## 🚀 クイックスタート

1. プロジェクトをクローンします

```bash
git clone git@github.com:JOYCEQL/magic-resume.git
cd magic-resume
```

2. 依存関係をインストールします

```bash
pnpm install
```

3. 開発サーバーを起動します

```bash
pnpm dev
```

4. ブラウザを開いて `http://localhost:3000` にアクセスします

### OrcaRouter（任意の AI プロバイダー）

AI Providers で OrcaRouter を選択し、[Magic Resume の紹介リンク](https://www.orcarouter.ai/ref/ref_54dd337f5d343624a551)から登録したうえで、OrcaRouter でサインインするか、ご自身の API キーを入力します。モデル一覧を取得し、モデルを選択して接続をテストします。

これはパートナーの紹介リンクです。Magic Resume は、紹介経由で登録したユーザーの対象利用に対して手数料を得る場合があります。他のプロバイダーも引き続き利用できます。OAuth サインインでも、認可時に新規登録ユーザー向けの同じ紹介コードが付与されます。

アプリの利用に関するアトリビューションは、登録紹介のアトリビューションとは別です。実際の `app_id` はパートナーコンソールの Integration ページから取得し、ビルド時に `VITE_ORCA_APP_ID` を設定して、`https://magicv.art/auth/orcarouter/callback` のようなデプロイ先のコールバック URL を正確に登録してください。ローカル開発では `http://localhost:3000/auth/orcarouter/callback` を使用します。`app_id` がない場合、アプリ利用のアトリビューションは設定されません。この変数は公開されるアプリケーション識別子であり、API キーではありません。[OrcaRouter パートナーアプリのドキュメント](https://docs.orcarouter.ai/getting-started/sign-in-with-orcarouter#verified-apps-partners)を参照してください。

ローカル開発では `.env.local` に `VITE_ORCA_APP_ID` を設定し、開発サーバーを再起動します。GitHub Actions の場合は、**Settings → Secrets and variables → Actions → Variables** でリポジトリ変数を追加します。Cloudflare と Docker の公開はいずれもビルド時にこれを渡します。Docker Compose はビルド引数をシェルまたは `.env` から読み取ります。直接ビルドする場合は `docker build --build-arg VITE_ORCA_APP_ID="$VITE_ORCA_APP_ID" -t magic-resume .` を使用します。この識別子はフロントエンドのビルドに埋め込まれるため、起動中のコンテナにのみ設定しても効果はありません。実際の値が利用可能になるまでは未設定のままにしてください。

## 📦 ビルドとデプロイ

```bash
pnpm build
```

### AI プロバイダーのネットワーク

Cloudflare Workers はプラットフォームネイティブの `fetch` を使用するため、アプリケーションレベルのプロキシは必要ありません。OpenAI、Gemini、Anthropic に直接到達できない地域での Node.js または Docker デプロイでは、`AI_PROXY_URL` を設定してください。フォールバックとして `HTTPS_PROXY` と `HTTP_PROXY` もサポートされています。

```bash
AI_PROXY_URL=http://127.0.0.1:7890
```

DeepSeek、Qwen、Doubao は引き続き直接接続を使用します。


## 🐳 Docker デプロイ

### Docker Compose

1. Docker と Docker Compose がインストールされていることを確認します

2. プロジェクトのルートディレクトリで次のコマンドを実行します：

```bash
docker compose up -d
```

これにより、次の処理が行われます：

- アプリケーションイメージを自動的にビルドします
- バックグラウンドでコンテナを起動します


## 📝 ライセンスと利用制限

本プロジェクトのソースコードは、追加の **非商用利用制限** 付きの **Apache 2.0** ライセンスで公開されています：

- **個人利用は無料**：純粋に個人的・非商用の目的（例：個人の学習、自分の履歴書の作成）であれば無料で使用できます。
- **商用利用は禁止**：**ソースコードを改変したかどうかにかかわらず**、有料または収益を生むサービスとしての提供（SaaS/PaaS など）、企業の商用運用、再販、二次的な商用開発を含む、いかなる商用目的にも本プロジェクトを使用することはできません。

詳細な条件については [LICENSE](LICENSE) ファイルを参照してください。

## 🗺️ ロードマップ

- [x] AI による執筆支援
- [x] 多言語対応
- [ ] より多くの履歴書テンプレートへの対応
- [x] より多くのエクスポート形式への対応
- [x] PDF、Markdown などのインポート
- [x] カスタムモデル
- [x] 自動 1 ページ化
- [ ] オンライン履歴書ホスティング

## 📈 スター履歴

<a href="https://star-history.com/#JOYCEQL/magic-resume&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=JOYCEQL/magic-resume&type=Date" />
 </picture>
</a>

## 📞 連絡先

次の方法で最新情報をフォローできます：

- 作者: Siyue
- X: @GuangzhouY81070
- Discord: コミュニティに参加する https://discord.gg/9mWgZrW3VN
- Email: 18806723365@163.com


- プロジェクトホームページ: https://github.com/JOYCEQL/magic-resume

## 🌟 応援

このプロジェクトが役立つと感じたら、ぜひスターをお願いします ⭐️
