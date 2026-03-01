import type { Request, Response, NextFunction } from "express";
import { resolveLocale } from "./index";

/**
 * Reads the Accept-Language header on every request and attaches the resolved
 * locale to req.locale so all downstream layers (errorHandler, validate,
 * controllers) can call t(key, req.locale) without re-parsing the header.
 *
 * Register this early in app.ts, before routers.
 *
 * Usage (app.ts):
 *   import { localeMiddleware } from "./shared/i18n/locale.middleware";
 *   app.use(localeMiddleware);
 */
export const localeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.locale = resolveLocale(req.headers["accept-language"]);
  next();
};
