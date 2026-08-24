import assert from "node:assert/strict";
import test from "node:test";
import type { Dispatcher } from "undici";

import {
  createProxyDispatcherInitializer,
  resolveProxyUrl,
} from "./proxy";

test("resolveProxyUrl follows the configured precedence", () => {
  assert.equal(
    resolveProxyUrl({
      HTTPS_PROXY: "http://https-upper:1",
      https_proxy: "http://https-lower:2",
      HTTP_PROXY: "http://http-upper:3",
      http_proxy: "http://http-lower:4",
    }),
    "http://https-upper:1",
  );

  assert.equal(
    resolveProxyUrl({
      https_proxy: "http://https-lower:2",
      HTTP_PROXY: "http://http-upper:3",
      http_proxy: "http://http-lower:4",
    }),
    "http://https-lower:2",
  );

  assert.equal(
    resolveProxyUrl({
      HTTP_PROXY: "http://http-upper:3",
      http_proxy: "http://http-lower:4",
    }),
    "http://http-upper:3",
  );

  assert.equal(
    resolveProxyUrl({
      http_proxy: "http://http-lower:4",
    }),
    "http://http-lower:4",
  );
});

test("initializer does nothing when no proxy is configured", () => {
  let createCount = 0;
  let setCount = 0;

  const ensureProxy = createProxyDispatcherInitializer({
    env: {},
    createAgent: () => {
      createCount += 1;
      return {} as Dispatcher;
    },
    setDispatcher: () => {
      setCount += 1;
    },
    warn: () => {},
  });

  ensureProxy();
  ensureProxy();

  assert.equal(createCount, 0);
  assert.equal(setCount, 0);
});

test("initializer installs the proxy dispatcher only once", () => {
  let createCount = 0;
  let setCount = 0;
  let receivedUrl = "";

  const dispatcher = {} as Dispatcher;
  const ensureProxy = createProxyDispatcherInitializer({
    env: {
      HTTPS_PROXY: "http://127.0.0.1:7897",
    },
    createAgent: (url) => {
      createCount += 1;
      receivedUrl = url;
      return dispatcher;
    },
    setDispatcher: (value) => {
      setCount += 1;
      assert.equal(value, dispatcher);
    },
    warn: () => {},
  });

  ensureProxy();
  ensureProxy();

  assert.equal(receivedUrl, "http://127.0.0.1:7897");
  assert.equal(createCount, 1);
  assert.equal(setCount, 1);
});

test("initializer records a failed attempt and does not retry repeatedly", () => {
  let createCount = 0;
  let warningCount = 0;

  const ensureProxy = createProxyDispatcherInitializer({
    env: {
      HTTPS_PROXY: "invalid-proxy",
    },
    createAgent: () => {
      createCount += 1;
      throw new Error("invalid proxy");
    },
    setDispatcher: () => {
      assert.fail("dispatcher must not be installed");
    },
    warn: () => {
      warningCount += 1;
    },
  });

  ensureProxy();
  ensureProxy();

  assert.equal(createCount, 1);
  assert.equal(warningCount, 1);
});
