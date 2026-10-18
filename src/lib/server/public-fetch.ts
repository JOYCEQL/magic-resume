// Match the existing AI transport's Node/Workers behavior for public resources.
// Node's built-in fetch does not honor HTTP(S)_PROXY on all supported versions.
let transport: Promise<{ fetcher: typeof fetch; dispatcher: unknown }> | undefined;

export async function fetchPublicResource(url: string, options: RequestInit) {
  const proxy = typeof process !== "undefined" && (
    process.env.HTTPS_PROXY || process.env.https_proxy ||
    process.env.HTTP_PROXY || process.env.http_proxy
  );
  if (!proxy || "WebSocketPair" in globalThis) return fetch(url, options);
  transport ??= (async () => {
    const packageName = "undici";
    const undici = await import(/* @vite-ignore */ packageName);
    return { fetcher: undici.fetch as unknown as typeof fetch, dispatcher: new undici.ProxyAgent(proxy) };
  })();
  const client = await transport;
  return client.fetcher(url, { ...options, dispatcher: client.dispatcher } as RequestInit);
}
