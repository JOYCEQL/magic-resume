import { NextRequest, NextResponse } from "next/server";

const DOUBAO_API_KEY = "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DOUBAO_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json(
      { error: "Failed to check grammar" },
      { status: 500 }
    );
  }
}
