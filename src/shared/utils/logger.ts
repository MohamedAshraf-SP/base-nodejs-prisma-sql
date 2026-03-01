/**
 * Simple structured logger.
 *
 * Outputs JSON-like logs with timestamp and level.
 * Replace with Winston/Pino when you need log rotation, transports, etc.
 *
 * Usage:
 *   import { logger } from "@shared/utils/logger";
 *   logger.info("Server started", { port: 3000 });
 *   logger.error("DB failed", err);
 */

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, meta?: unknown): void {
    console.log(JSON.stringify({ level: "info", time: timestamp(), message, ...(meta && typeof meta === "object" ? meta : { data: meta }) }));
  },

  warn(message: string, meta?: unknown): void {
    console.warn(JSON.stringify({ level: "warn", time: timestamp(), message, ...(meta && typeof meta === "object" ? meta : { data: meta }) }));
  },

  error(message: string, meta?: unknown): void {
    const errorMeta =
      meta instanceof Error
        ? { error: meta.message, stack: meta.stack }
        : meta && typeof meta === "object"
          ? meta
          : { data: meta };

    console.error(JSON.stringify({ level: "error", time: timestamp(), message, ...errorMeta }));
  },
};
