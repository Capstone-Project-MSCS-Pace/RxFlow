const { createProxyMiddleware } = require("http-proxy-middleware");

const DEFAULT_PROXY_TARGET = "http://127.0.0.1:5000";

module.exports = function setupProxy(app) {
  const target = process.env.DEV_SERVER_PROXY_TARGET || DEFAULT_PROXY_TARGET;

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: "warn",
    }),
  );
};
