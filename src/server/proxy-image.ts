import { createServerFn } from "@tanstack/react-start";

interface ProxyImageRequest {
  url: string;
}

export const proxyImage = createServerFn({
  method: "POST",
}).handler(async (ctx) => {
  const data = (ctx as any).data as ProxyImageRequest;
  const imageUrl = data.url;

  if (!imageUrl) {
    throw new Error("Missing required field: url");
  }

  // Validate URL
  try {
    new URL(imageUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
