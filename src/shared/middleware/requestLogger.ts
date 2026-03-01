import type { Request, Response, NextFunction } from "express";

/**
 * Logs every HTTP request with method, path, status code, and duration.
 *
 * Output: [http] GET /api/users 200 12ms
 *
 * Register BEFORE routes in app.ts.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`[http] ${req.method} ${req.originalUrl} ${status} ${duration}ms`);
  });

  next();
};
