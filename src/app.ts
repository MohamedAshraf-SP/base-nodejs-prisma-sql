import express from "express";
import cors from "cors";
import helmet from "helmet";
import { registerApis } from "@apis";
import { env } from "@infra/config";
import { db } from "@infra/database";
import { errorHandler, localeMiddleware, requestLogger } from "@shared/middleware";

/**
 * Express application factory.
 *
 * Separated from server.ts so we can import `app` for testing
 * without starting the HTTP listener.
 */
export function createApp(): express.Express {
  const app = express();

  // --------------- Global Middleware ---------------
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "10kb" }));
  app.use(requestLogger);
  app.use(localeMiddleware);

  // --------------- Health Check --------------------
  app.get("/health", async (_req, res) => {
    try {
      await db.healthCheck();
      res.json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
      });
    } catch {
      res.status(503).json({ status: "unhealthy" });
    }
  });

  // --------------- API Routers ---------------------
  registerApis(app);

  // --------------- 404 Fallback --------------------
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  // --------------- Global Error Handler ------------
  app.use(errorHandler);

  return app;
}
