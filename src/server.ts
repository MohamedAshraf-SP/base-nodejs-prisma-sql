import { env } from "@infra/config";
import { createApp } from "./app";
import { db } from "@infra/database";

/**
 * Application entry point.
 *
 * Starts the Express HTTP server, verifies DB, and registers
 * process-level error/shutdown handlers.
 */
const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`[server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);

  try {
    await db.healthCheck();
    console.log("[db] Connected successfully to database");
  } catch (err) {
    console.error("[db] Failed to connect to database:", err);
    process.exit(1);
  }
});

// ============================================
// Graceful Shutdown
// ============================================
async function shutdown(signal: string): Promise<void> {
  console.log(`[server] ${signal} received — shutting down gracefully`);

  server.close(async () => {
    try {
      await db.disconnect();
      console.log("[db] Disconnected");
    } catch (err) {
      console.error("[db] Error during disconnect:", err);
    }
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error("[server] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ============================================
// Process-Level Error Handlers
// ============================================
process.on("unhandledRejection", (reason) => {
  console.error("[process] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[process] Uncaught Exception:", err);
  process.exit(1);
});
