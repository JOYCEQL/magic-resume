// import puppeteer from "puppeteer";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";

export async function POST(req: Request) {
  try {
    const { content, styles, margin } = await req.json();
    console.log(content, "process.env.FONT_URL");

    // const browser = await puppeteer.launch({
    //   headless: true
    // });

    const browser = await puppeteer.launch({
      args: [...chrome.args, "--font-render-hinting=none"],
      //   defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar`
      ),
      headless: chrome.headless
    });

    const page = await browser.newPage();

    const pdfContent = `
    <html>
     <head>
          <style>
          @font-face {
            font-family: 'Noto Sans SC';
            src: url('${process.env.FONT_URL}') format('woff2');
            font-display: swap;
          }
        </style>
        <style> ${styles} </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
    console.log(pdfContent, "pdfContent");

    // 等待font加载完成
    await page.evaluateHandle("document.fonts.ready");

    await page.setContent(pdfContent);

    const marginPx = margin + "px";

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: marginPx,
        right: marginPx,
        bottom: 0,
        left: marginPx
      }
    });

    await chrome.font(`${process.env.FONT_URL}`);

    await page.setContent(content, {
      waitUntil: ["domcontentloaded", "networkidle0"]
    });

    await page.evaluateHandle("document.fonts.ready");

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=document.pdf"
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
