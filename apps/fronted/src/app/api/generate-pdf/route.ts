// import puppeteer from "puppeteer";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";
export async function POST(req: Request) {
  try {
    const { content, margin } = await req.json();

    // 客户端环境
    // const browser = await puppeteer.launch({
    //   headless: true
    // });

    // 无服务器端
    const browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless
    });

    const page = await browser.newPage();

    await page.setContent(content);

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
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
