import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url);
          const imageUrl = searchParams.get("url");

          if (!imageUrl) {
            console.error("缺少图片URL参数");
            return Response.json({ error: "缺少图片URL参数" }, { status: 400 });
          }

          let parsedUrl: URL;
          try {
            parsedUrl = new URL(imageUrl);
          } catch (_error) {
            console.error(`图片URL格式不正确: ${imageUrl}`);
            return Response.json({ error: "图片URL格式不正确" }, { status: 400 });
          }

          if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            console.error(`不支持的URL协议: ${parsedUrl.protocol}`);
            return Response.json({ error: "只支持HTTP和HTTPS协议" }, { status: 400 });
          }

          let response: Response;
          try {
            response = await fetch(imageUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                Referer: parsedUrl.origin
              }
            });
          } catch (error: any) {
            console.error(`获取图片失败: ${error.message || "未知错误"}`);
            return Response.json({ error: `获取图片失败: ${error.message || "未知错误"}` }, { status: 500 });
          }

          if (!response.ok) {
            console.error(`图片服务器返回错误: ${response.status} ${response.statusText}`);
            return Response.json({ error: `获取图片失败: ${response.status} ${response.statusText}` }, { status: response.status });
          }

          let imageBuffer: ArrayBuffer;
          try {
            imageBuffer = await response.arrayBuffer();
          } catch (error: any) {
            console.error(`读取图片内容失败: ${error.message || "未知错误"}`);
            return Response.json({ error: `读取图片内容失败: ${error.message || "未知错误"}` }, { status: 500 });
          }

          if (imageBuffer.byteLength === 0) {
            console.error("图片内容为空");
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
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            }
          });
        } catch (error: any) {
          console.error("图片代理未处理的错误:", error);
          return Response.json({ error: `处理图片请求时出错: ${error.message || "未知错误"}` }, { status: 500 });
        }
      }
    }
  }
});
