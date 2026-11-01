import { useEffect } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  MonitorSmartphone,
  BriefcaseBusiness,
  Download,
} from "lucide-react";
import Link from "@/lib/link";
import Logo from "@/components/shared/Logo";
import offerinIcon from "@/assets/offerin/offerin-icon.png";
import dualConnectImg from "@/assets/offerin/offerin-dual-connect.webp";
import examOverviewImg from "@/assets/offerin/offerin-exam-overview.webp";
import {
  OFFERIN_AFFILIATE_URL,
  trackOfferInEvent,
  type TrackPlacement,
} from "./config";
import "./offerin.scss";

export default function OfferInPage() {
  useEffect(() => {
    trackOfferInEvent("aff_page_view");
  }, []);

  const handleAffiliateClick = (placement: TrackPlacement) => {
    trackOfferInEvent("aff_outbound_click", { placement });
  };

  return (
    <div className="offerin-page">
      <a className="skip" href="#main">
        跳转到主要内容
      </a>

      {/* Header */}
      <header className="header">
        <div className="shell header-inner flex items-center justify-between gap-6">
          <Link href="/zh" className="brand" aria-label="返回魔方简历首页">
            <Logo size={32} />
            <span>魔方简历</span>
          </Link>
          <nav className="header-nav" aria-label="主导航">
            <Link href="/zh">简历制作</Link>
            <a href="#main" aria-current="page">
              AI 面试助手
            </a>
            <a href="#questions">常见问题</a>
            <a
              className="btn"
              href={OFFERIN_AFFILIATE_URL}
              target="_blank"
              rel="sponsored noopener"
              onClick={() => handleAffiliateClick("header")}
              aria-label="开始使用（在新标签页打开 OfferIN AI）"
            >
              开始使用
              <ArrowUpRight className="icon" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="shell hero-grid grid items-center pb-20">
            <div className="hero-copy">
              <div className="partner flex items-center gap-2.5">
                <span className="line" />
                <span>魔方简历 × OfferIN AI</span>
              </div>
              <h1 id="hero-title" className="display-title">
                写完简历
                <br />
                即刻拿下<span className="accent">面试笔试</span>
              </h1>
              <p className="hero-description">
                先用 AI，<strong>先拿 Offer</strong>，干掉八股，干掉测评
                <br />
                面试笔试都能用，各行各业都在用
              </p>
              <div className="hero-actions flex flex-wrap items-center">
                <a
                  className="btn"
                  href={OFFERIN_AFFILIATE_URL}
                  target="_blank"
                  rel="sponsored noopener"
                  onClick={() => handleAffiliateClick("hero")}
                  aria-label="开始使用（在新标签页打开 OfferIN AI）"
                >
                  开始使用
                  <ChevronRight className="icon" aria-hidden="true" />
                </a>
              </div>
              <p className="hero-note">
                <ExternalLink className="icon" aria-hidden="true" />
                合作伙伴 OfferIN AI 独立提供服务
              </p>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <div className="chapter-strip">
          <div className="shell chapters grid">
            <div className="chapter flex items-start">
              <span className="chapter-num">01</span>
              <div>
                <h2>准备简历</h2>
                <p>魔方简历，写出精彩</p>
              </div>
            </div>
            <div className="chapter active flex items-start">
              <span className="chapter-num">02</span>
              <div>
                <h2>从容面试笔试</h2>
                <p>OfferIN AI 一站式辅助</p>
              </div>
            </div>
            <div className="chapter flex items-start">
              <span className="chapter-num">03</span>
              <div>
                <h2>顺利上岸</h2>
                <p>拿到下一个 Offer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase */}
        <section id="explore" className="shell showcase" aria-label="产品功能">
          <div className="feature-sections">
            <section className="feature-section" aria-labelledby="interview-title">
              <h2 id="interview-title">一键 AI 面试辅助</h2>
              <p className="feature-subtitle">实时识别语音问题，生成回答建议</p>
              <figure className="feature-screenshot">
                <img
                  src={dualConnectImg}
                  width={2554}
                  height={1604}
                  alt="OfferIN AI 面试练习界面：电脑与平板双端互联，同步展示语音问题和 AI 回答"
                  loading="lazy"
                />
              </figure>
            </section>
            <section className="feature-section" aria-labelledby="exam-title">
              <h2 id="exam-title">
                全自动笔试模式
                <br />
                八大顶流 AI 齐上阵
              </h2>
              <p className="feature-subtitle">
                无需复制，无需手敲，自动回答。
                <br />
                （适用于所有在线笔试、各类测评、编程、行测、图推、资料分析等）
              </p>
              <figure className="feature-screenshot">
                <img
                  src={examOverviewImg}
                  width={2571}
                  height={1717}
                  alt="OfferIN AI 笔试模式产品界面：题目截图与多模型分析、答案解析"
                  loading="lazy"
                />
              </figure>
            </section>
          </div>
          <div className="feature-bottom grid">
            <div className="small-feature flex items-start">
              <MonitorSmartphone className="icon" aria-hidden="true" />
              <div>
                <h3>电脑做题，手机辅助</h3>
                <p>在手机或平板上隐秘查看辅助内容</p>
              </div>
            </div>
            <div className="small-feature flex items-start">
              <BriefcaseBusiness className="icon" aria-hidden="true" />
              <div>
                <h3>各行各业都在用</h3>
                <p>技术开发、产品与设计、商业与职能</p>
              </div>
            </div>
            <div className="small-feature flex items-start">
              <Download className="icon" aria-hidden="true" />
              <div>
                <h3>AI 复盘面试记录</h3>
                <p>一键导出，随时复盘</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="questions"
          className="shell faq grid"
          aria-labelledby="faq-title"
        >
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 id="faq-title" className="display-title section-title">
              常见问题
            </h2>
            <p className="muted mt-4 text-[13px] leading-7">
              关于使用方式与合作服务的几个小问题
            </p>
          </div>
          <div>
            <article className="faq-item">
              <h3 className="question">OfferIN AI 和魔方简历分别做什么？</h3>
              <p>
                魔方简历帮助你制作与优化简历；OfferIN AI
                提供面试辅助、笔试辅助等辅助工具。本页为合作推荐入口，点击体验按钮后将进入
                OfferIN AI，由其独立提供产品与服务。
              </p>
            </article>
            <article className="faq-item">
              <h3 className="question">魔方简历的账号、简历会自动同步吗？</h3>
              <p>
                本合作入口只提供跳转，不会自动同步魔方简历账号或简历内容。进入
                OfferIN AI 后，请按其页面指引登录与使用。
              </p>
            </article>
            <article className="faq-item">
              <h3 className="question">需要下载软件吗？</h3>
              <p>
                OfferIN AI
                可以在电脑、手机或平板的浏览器中打开。双端互联等增强场景可配合桌面客户端使用，具体设备要求与操作步骤以
                OfferIN AI 当前使用说明为准。
              </p>
            </article>
            <article className="faq-item">
              <h3 className="question">如何了解价格和可用额度？</h3>
              <p>
                点击本页体验入口进入 OfferIN AI，即可查看当前方案及可用额度。价格、活动与具体功能以
                OfferIN AI 页面显示为准。
              </p>
            </article>
          </div>
        </section>

        {/* Closing CTA */}
        <section
          className="shell closing flex items-center justify-between"
          aria-labelledby="closing-title"
        >
          <div>
            <h2 id="closing-title" className="display-title">
              准备好了吗
              <br />
              即刻开启面试新体验
            </h2>
            <p>AI 时代面试笔试助手，祝您轻松上岸</p>
          </div>
          <div className="closing-action">
            <a
              className="btn"
              href={OFFERIN_AFFILIATE_URL}
              target="_blank"
              rel="sponsored noopener"
              onClick={() => handleAffiliateClick("closing")}
              aria-label="开始使用（在新标签页打开 OfferIN AI）"
            >
              开始使用
              <ArrowUpRight className="icon" aria-hidden="true" />
            </a>
            <span>魔方简历 × OfferIN AI · 合作推荐</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="shell footer-inner flex items-center justify-between">
          <div className="footer-brands">
            <Logo size={24} />
            魔方简历
            <span className="font-normal text-slate-400" aria-hidden="true">
              ×
            </span>
            <img
              className="offer-icon"
              src={offerinIcon}
              width={22}
              height={22}
              alt="OfferIN AI"
            />
            OfferIN AI
          </div>
          <p className="footer-note">
            本页为联盟合作推荐，OfferIN AI 由合作伙伴独立运营。产品功能、价格与服务条款以其实际页面为准。
          </p>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="mobile-cta" aria-label="快捷体验入口">
        <div>
          <strong>AI 时代面试笔试助手</strong>
          <small>OfferIN AI 倾力打造</small>
        </div>
        <a
          className="btn"
          href={OFFERIN_AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener"
          onClick={() => handleAffiliateClick("mobile-sticky")}
          aria-label="即刻开始（在新标签页打开 OfferIN AI）"
        >
          即刻开始
          <ArrowUpRight className="icon" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
