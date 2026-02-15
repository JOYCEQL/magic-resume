import { createFileRoute } from "@tanstack/react-router";

function validateImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return {
      ok: false,
      status: 400,
      error: "缺少图片URL参数"
    } as const;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return {
      ok: false,
      status: 400,
      error: "图片URL格式不正确"
    } as const;
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      ok: false,
      status: 400,
      error: "只支持HTTP和HTTPS协议"
    } as const;
  }

  return {
    ok: true,
    parsedUrl
  } as const;
}

function buildHeaders(parsedUrl: URL) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    Referer: parsedUrl.origin
  };
}

export const Route = createFileRoute("/api/proxy/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url);
          const imageUrl = searchParams.get("url");

          const validation = validateImageUrl(imageUrl);
          if (!validation.ok) {
            return Response.json({ error: validation.error }, { status: validation.status });
          }

          const response = await fetch(imageUrl!, {
            headers: buildHeaders(validation.parsedUrl)
          });

          if (!response.ok) {
            return Response.json(
              { error: `获取图片失败: ${response.status} ${response.statusText}` },
              { status: response.status }
            );
          }

          const imageBuffer = await response.arrayBuffer();
          if (imageBuffer.byteLength === 0) {
            return Response.json({ error: "图片内容为空" }, { status: 400 });
          }

          const contentType = response.headers.get("content-type") || "image/jpeg";

          return new Response(imageBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
              "Surrogate-Control": "no-store",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            }
          });
        } catch (error: any) {
          console.error("图片代理未处理的错误:", error);
          return Response.json(
            { error: `处理图片请求时出错: ${error?.message || "未知错误"}` },
            { status: 500 }
          );
        }
      },
      HEAD: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url);
          const imageUrl = searchParams.get("url");

          const validation = validateImageUrl(imageUrl);
          if (!validation.ok) {
            return new Response(null, { status: validation.status });
          }

          const response = await fetch(imageUrl!, {
            method: "HEAD",
            headers: buildHeaders(validation.parsedUrl)
          });

          if (!response.ok) {
            return new Response(null, { status: response.status });
          }

          const headers = new Headers();
          const contentType = response.headers.get("content-type");
          const contentLength = response.headers.get("content-length");

          if (contentType) {
            headers.set("content-type", contentType);
          }

          if (contentLength) {
            headers.set("content-length", contentLength);
          }

          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
          headers.set("Access-Control-Allow-Headers", "Content-Type");

          return new Response(null, {
            status: 200,
            headers
          });
        } catch (error) {
          return new Response(null, { status: 500 });
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    }
  }
});
