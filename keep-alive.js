/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Keep-Alive Service
 * يضمن استمرار عمل الخادم عبر ping دوري
 */
const http = require("node:http");

const TARGET = process.env.HEALTH_CHECK_URL || "http://localhost:3000/api/health";
const INTERVAL = parseInt(process.env.KEEP_ALIVE_INTERVAL || "30000", 10); // 30 ثانية
const MAX_FAILURES = 3;
let failureCount = 0;

function ping() {
  const url = new URL(TARGET);
  const req = http.get(
    {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      timeout: 5000,
    },
    (res) => {
      if (res.statusCode === 200) {
        if (failureCount > 0) {
          console.log(`[keepalive] recovered after ${failureCount} failures`);
        }
        failureCount = 0;
      } else {
        failureCount += 1;
        console.warn(
          `[keepalive] health check returned ${res.statusCode} (failure ${failureCount}/${MAX_FAILURES})`,
        );
      }
    },
  );

  req.on("error", (err) => {
    failureCount += 1;
    console.error(
      `[keepalive] health check failed (${failureCount}/${MAX_FAILURES}):`,
      err.message,
    );
  });

  req.on("timeout", () => {
    failureCount += 1;
    console.warn(`[keepalive] health check timeout`);
    req.destroy();
  });

  req.end();
}

// ابدأ المراقبة
console.log(
  `[keepalive] starting health checker for ${TARGET} every ${INTERVAL}ms`,
);
setInterval(ping, INTERVAL);
// أول ping فوراً
ping();

// ابقاء العملية حية
setInterval(() => {}, 1000);
