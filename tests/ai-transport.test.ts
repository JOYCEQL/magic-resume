import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { connect, type Socket, type AddressInfo } from "node:net";
import { handleModelsRequest } from "../src/lib/server/ai-models";

// Exercise real HTTP and CONNECT sockets with fixture credentials only.
test("model discovery uses AI_PROXY_URL for eligible Node providers and leaves other transports alone", async (t) => {
  const sockets = new Set<Socket>();
  const track = (socket: Socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  };
  const upstream = createServer((req, res) => {
    assert.equal(req.headers.authorization, "Bearer fixture-key");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ data: [{ id: "fixture-model" }] }));
  });
  let tunnels = 0;
  const proxy = createServer();
  proxy.on("connect", (req, client, head) => {
    tunnels++;
    assert.equal(req.url, "models.test.invalid:80");
    const remote = connect((upstream.address() as AddressInfo).port, "127.0.0.1", () => {
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) remote.write(head);
      remote.pipe(client);
      client.pipe(remote);
    });
    track(remote);
    remote.on("error", () => client.destroy());
    client.on("error", () => remote.destroy());
  });
  upstream.on("connection", track);
  proxy.on("connection", track);
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  const savedProxy = process.env.AI_PROXY_URL;
  process.env.AI_PROXY_URL = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
  t.after(async () => {
    if (savedProxy === undefined) delete process.env.AI_PROXY_URL;
    else process.env.AI_PROXY_URL = savedProxy;
    for (const socket of sockets) socket.destroy();
    await Promise.all([upstream, proxy].map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  });
  const request = (provider: string, baseUrl: string) => new Request("http://localhost/api/models", {
    method: "POST", body: JSON.stringify({ provider, apiKey: "fixture-key", baseUrl }),
  });
  const proxied = await handleModelsRequest(request("openai", "http://models.test.invalid/v1"));
  assert.equal(proxied.status, 200);
  assert.equal((await proxied.json()).models[0].id, "fixture-model");
  assert.equal(tunnels, 1);

  const direct = await handleModelsRequest(request("qwen", `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/v1`));
  assert.equal(direct.status, 200);
  assert.equal(tunnels, 1, "providers outside the proxy allowlist stay direct");

  let injectedCalls = 0;
  const injected = await handleModelsRequest(request("openai", "https://injected.invalid/v1"), (async () => {
    injectedCalls++;
    return Response.json({ data: [] });
  }) as typeof fetch);
  assert.equal(injected.status, 200);
  assert.equal(injectedCalls, 1);
  assert.equal(tunnels, 1, "an injected fetch must never be replaced by the proxy");
});
