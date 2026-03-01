import type { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler so thrown errors are forwarded to Express
 * error middleware automatically -- no try/catch needed in controllers.
 *
 * Usage (in router):
 *   router.get("/", asyncHandler(controller.list));
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
