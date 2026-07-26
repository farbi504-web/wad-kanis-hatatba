#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Production Starter with Monitoring
 * يشغل الخادم + keep-alive في نفس الوقت
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const server = spawn("node", ["server.js"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

const monitor = spawn("node", ["keep-alive.js"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

const shutdown = (code) => {
  console.log(`[starter] shutting down (code: ${code})`);
  server.kill("SIGTERM");
  monitor.kill("SIGTERM");
  process.exit(code);
};

server.on("exit", (code) => {
  console.log(`[starter] server exited with code ${code}`);
  shutdown(code || 0);
});

monitor.on("exit", (code) => {
  console.log(`[starter] monitor exited with code ${code}`);
});

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
