import {
  ProxyAgent,
  setGlobalDispatcher,
  type Dispatcher,
} from "undici";

export type ProxyEnvironment = {
  [key: string]: string | undefined;
  HTTPS_PROXY?: string;
  https_proxy?: string;
  HTTP_PROXY?: string;
  http_proxy?: string;
};

type ProxyDispatcherDependencies = {
  env: ProxyEnvironment;
  createAgent: (proxyUrl: string) => Dispatcher;
  setDispatcher: (dispatcher: Dispatcher) => void;
  warn: (message: string, error: unknown) => void;
};

export const resolveProxyUrl = (
  env: ProxyEnvironment,
): string | undefined =>
  env.HTTPS_PROXY ||
  env.https_proxy ||
  env.HTTP_PROXY ||
  env.http_proxy;

export const createProxyDispatcherInitializer = (
  dependencies: ProxyDispatcherDependencies,
) => {
  let initialized = false;

  return () => {
    if (initialized) {
      return;
    }

    const proxyUrl = resolveProxyUrl(dependencies.env);

    if (!proxyUrl) {
      initialized = true;
      return;
    }

    try {
      const dispatcher = dependencies.createAgent(proxyUrl);
      dependencies.setDispatcher(dispatcher);
    } catch (error) {
      dependencies.warn(
        "Failed to initialize server proxy dispatcher:",
        error,
      );
    } finally {
      initialized = true;
    }
  };
};

export const ensureServerProxyDispatcher =
  createProxyDispatcherInitializer({
    env: process.env,
    createAgent: (proxyUrl) => new ProxyAgent(proxyUrl),
    setDispatcher: setGlobalDispatcher,
    warn: (message, error) => console.warn(message, error),
  });
