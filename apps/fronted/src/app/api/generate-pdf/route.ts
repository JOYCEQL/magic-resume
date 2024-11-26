// import puppeteer from "puppeteer";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chrome from "@sparticuz/chromium";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const { content, margin } = await req.json();

    // const browser = await puppeteer.launch({
    //   headless: true
    // });

    const browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--font-render-hinting=none"
      ],
      //   defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v126.0.0/chromium-v126.0.0-pack.tar`
      ),
      headless: chrome.headless
    });

    const page = await browser.newPage();
    const fontPath = path.join(process.cwd(), "fonts", "NaihuSC.woff2");
    const fontBuffer = fs.readFileSync(fontPath);

    await page.evaluate(async (fontBuffer) => {
      const font = new FontFace("Naihu SC", fontBuffer);
      await font.load();
      document.fonts.add(font);
    }, fontBuffer);

    await page.setContent(content);

    await page.evaluate(() => document.fonts.ready);

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
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
