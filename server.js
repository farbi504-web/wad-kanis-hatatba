/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Standalone Production Server
 * خادم مستقل يضمن استمرارية عمل المنصة
 * - يستخدم Next.js Standalone Output
 * - يراقب نفسه ويعيد التشغيل عند التوقف
 * - يعالج الأخطاء بشكل آمن
 */
const { createServer } = require("node:http");
const { parse } = require("node:url");
const next = require("next");
const fs = require("node:fs");
const path = require("node:path");

const dev = false;
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({
  dev,
  hostname,
  port,
  dir: process.cwd(),
  conf: {
    outputStandalone: "standalone",
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  },
});

const handle = app.getRequestHandler();

let server;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 10;

async function startServer() {
  try {
    await app.prepare();
    console.log(`[server] Next.js prepared successfully`);

    server = createServer(async (req, res) => {
      const startTime = Date.now();
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          console.warn(
            `[server] slow request: ${req.method} ${req.url} took ${duration}ms`,
          );
        }
      } catch (err) {
        console.error(`[server] request error:`, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(
            "<html><body><h1>خطأ في الخادم</h1><p>حاول مرة أخرى</p></body></html>",
          );
        }
      }
    });

    // إعدادات Keep-Alive محسّنة
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.on("error", (err) => {
      console.error("[server] server error:", err);
      if (err.code === "EADDRINUSE") {
        console.error(`[server] port ${port} is already in use`);
        process.exit(1);
      }
    });

    server.on("clientError", (err, socket) => {
      console.warn("[server] client error:", err.message);
      if (socket.writable) {
        socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      }
    });

    server.listen(port, hostname, () => {
      restartAttempts = 0;
      console.log(
        `> Server ready on http://${hostname}:${port} (pid: ${process.pid})`,
      );
    });
  } catch (err) {
    console.error("[server] failed to start:", err);
    handleRestart();
  }
}

function handleRestart() {
  restartAttempts += 1;
  if (restartAttempts > MAX_RESTART_ATTEMPTS) {
    console.error(
      `[server] max restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting.`,
    );
    process.exit(1);
  }
  const delay = Math.min(1000 * restartAttempts, 10000);
  console.log(
    `[server] restarting in ${delay}ms (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`,
  );
  setTimeout(() => {
    if (server) {
      server.close(() => startServer());
    } else {
      startServer();
    }
  }, delay);
}

// معالجات الإشارات لإعادة التشغيل بشكل آمن
process.on("SIGTERM", () => {
  console.log("[server] SIGTERM received, shutting down gracefully");
  if (server) {
    server.close(() => {
      console.log("[server] closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", () => {
  console.log("[server] SIGINT received");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception:", err);
  handleRestart();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[server] unhandled rejection at:", promise, "reason:", reason);
});

// معالج يمنع الخادم من الإغلاق
process.on("exit", (code) => {
  console.log(`[server] exiting with code ${code}`);
});

// Keep alive
setInterval(() => {
  // نبقي event loop نشطاً
}, 30000);

startServer();
