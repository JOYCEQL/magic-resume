import puppeteer from "puppeteer";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  try {
    const { content, margin } = await req.json();

    const browser = await puppeteer.launch({
      headless: true
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
