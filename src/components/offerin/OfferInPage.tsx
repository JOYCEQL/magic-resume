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
          <div className="brand-combo flex items-center gap-3">
            <Link href="/zh" className="brand" aria-label="返回魔方简历首页">
              <Logo size={28} />
              <span>魔方简历</span>
            </Link>
            <span className="brand-combo-x" aria-hidden="true">
              ×
            </span>
            <div className="brand partner-brand">
              <img
                src={offerinIcon}
                alt="OfferIN AI"
                width={24}
                height={24}
                className="offer-icon"
              />
              <span>OfferIN AI</span>
            </div>
          </div>
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
              {/* 强化的双品牌战略合作 Badge */}
              <div className="hero-cobrand-badge">
                <div className="cobrand-pill">
                  <span className="cobrand-brand">
                    <Logo size={18} />
                    <span>魔方简历</span>
                  </span>
                  <span className="cobrand-times">×</span>
                  <span className="cobrand-brand">
                    <img
                      src={offerinIcon}
                      alt="OfferIN AI"
                      width={18}
                      height={18}
                      className="rounded"
                    />
                    <span>OfferIN AI</span>
                  </span>
                  <span className="cobrand-tag">战略合作</span>
                </div>
              </div>

              <h1 id="hero-title" class="display-title">
                写完简历
                <br />
                即刻拿下<span class="accent">面试笔试</span>
              </h1>
              <p className="hero-description">
                <strong>简历写好了，面试更有底气。</strong>
                <br />
                魔方简历携手 OfferIN AI，用全自动面试练习与笔试真题解析，干掉八股，干掉测评，为你的求职之路全程护航。
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
                  开启面试笔试特训
                  <ChevronRight className="icon" aria-hidden="true" />
                </a>
              </div>
              <p className="hero-note">
                <ExternalLink className="icon" aria-hidden="true" />
                魔方简历 × OfferIN AI · 官方战略合作通道
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
                <h2>第一阶段 · 制作简历</h2>
                <p>
                  <strong>魔方简历</strong>｜精心打磨，专业出彩
                </p>
              </div>
            </div>
            <div className="chapter active flex items-start">
              <span className="chapter-num">02</span>
              <div>
                <h2>第二阶段 · 冲刺面试笔试</h2>
                <p>
                  <strong>OfferIN AI</strong>｜实时答疑，沉着应战
                </p>
              </div>
            </div>
            <div className="chapter flex items-start">
              <span className="chapter-num">03</span>
              <div>
                <h2>第三阶段 · 顺利上岸</h2>
                <p>双剑合璧｜轻松拿下心仪 Offer</p>
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
            <h2 id="faq-title" class="display-title section-title">
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
                提供面试辅助、笔试辅助等辅助工具。本页为官方战略合作通道，点击体验按钮后将进入
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
            <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-medium">
              <Logo size={16} />
              <span>魔方简历</span>
              <span className="text-blue-300">×</span>
              <img src={offerinIcon} width={15} height={15} className="rounded" alt="" />
              <span>OfferIN AI</span>
              <span className="text-[10px] text-blue-500 bg-white/80 px-1.5 py-0.5 rounded-full border border-blue-100/80 ml-1">
                战略合作
              </span>
            </div>
            <h2 id="closing-title" class="display-title">
              准备好了吗
              <br />
              即刻开启求职全流程新体验
            </h2>
            <p>魔方简历写出精彩，OfferIN AI 保驾护航，祝您轻松拿下下一个 Offer</p>
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
              开启面试笔试特训
              <ArrowUpRight className="icon" aria-hidden="true" />
            </a>
            <span>魔方简历 × OfferIN AI · 战略合作</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="shell footer-inner flex items-center justify-between">
          <div className="footer-brands">
            <Logo size={24} />
            <span>魔方简历</span>
            <span className="font-normal text-slate-400 mx-0.5" aria-hidden="true">
              ×
            </span>
            <img
              className="offer-icon"
              src={offerinIcon}
              width={22}
              height={22}
              alt="OfferIN AI"
            />
            <span>OfferIN AI</span>
          </div>
          <p className="footer-note">
            本页为魔方简历与 OfferIN AI 战略合作专区。OfferIN AI 产品与服务由其合作伙伴独立运营，价格与条款以其实际页面为准。
          </p>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="mobile-cta" aria-label="快捷体验入口">
        <div>
          <strong>魔方简历 × OfferIN AI</strong>
          <small>求职全流程 · 战略合作</small>
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
