import type { Request, Response, NextFunction } from "express";
import { AppError } from "@core/errors";
import { t } from "../i18n";
import type { Locale, TranslationParams } from "../i18n";
import { logger } from "../utils/logger";

/**
 * Global error handler -- must be the LAST middleware registered on the app.
 *
 * - Operational errors (AppError): translates the message into req.locale,
 *   then returns the status & message to the client.
 * - Unknown errors: logs the stack and returns a generic 500.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const locale: Locale = req.locale ?? "en";

  if (err instanceof AppError) {
    const message = resolveMessage(err, locale);
    const response: Record<string, unknown> = { success: false, message };
    if (err.details) {
      response.errors = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    success: false,
    message: t("common.internalError", locale),
  });
};

/**
 * Resolves the translated message for an AppError.
 *
 * If the error has a messageKey, translate it. The messageParams may contain
 * nested translation keys (e.g. resource: "resources.user") — those are
 * resolved first so the final string is fully translated.
 */
function resolveMessage(err: AppError, locale: Locale): string {
  if (!err.messageKey) return err.message;

  const resolvedParams = resolveParams(err.messageParams, locale);
  return t(err.messageKey, locale, resolvedParams);
}

/**
 * Resolves each param value: if a value looks like a translation key
 * (contains a dot and matches "namespace.key" pattern), translate it.
 */
function resolveParams(
  params: TranslationParams | undefined,
  locale: Locale,
): TranslationParams | undefined {
  if (!params) return undefined;

  const KEY_PATTERN = /^(common|validation|resources)\..+$/;
  const resolved: TranslationParams = {};

  for (const [k, v] of Object.entries(params)) {
    resolved[k] =
      typeof v === "string" && KEY_PATTERN.test(v)
        ? t(v as import("@shared/i18n").TranslationKey, locale)
        : v;
  }

  return resolved;
}
