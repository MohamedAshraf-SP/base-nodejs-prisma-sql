import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { ValidationError } from "@core/errors";
import { t } from "../i18n";
import type { Locale, TranslationParams } from "../i18n";

/**
 * Zod validation middleware factory.
 *
 * Validates req.body (or req.query / req.params) against a Zod schema.
 * On failure, throws BadRequestError with translated, structured field errors.
 *
 * Locale is read from req.locale (set by localeMiddleware).
 *
 * Usage (in router):
 *   router.post("/", validate(createUserSchema), asyncHandler(controller.create));
 *
 * You can validate other sources:
 *   validate(schema, "query")
 *   validate(schema, "params")
 */
export const validate =
  (schema: ZodSchema, source: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const locale = req.locale ?? "en";
        const details = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: translateZodIssue(issue, locale),
        }));
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };

function translateZodIssue(issue: ZodIssue, locale: Locale): string {
  const field = issue.path.join(".") || "value";
  const base: TranslationParams = { field };

  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined") {
        return t("validation.required", locale, base);
      }
      return t("validation.invalid_type", locale, {
        ...base,
        expected: issue.expected,
      });

    case "too_small":
      return t("validation.too_small", locale, {
        ...base,
        minimum: String(issue.minimum),
      });

    case "too_big":
      return t("validation.too_big", locale, {
        ...base,
        maximum: String(issue.maximum),
      });

    case "invalid_string":
      if (issue.validation === "email") {
        return t("validation.invalid_email", locale, base);
      }
      if (issue.validation === "url") {
        return t("validation.invalid_url", locale, base);
      }
      return t("validation.invalid_string", locale, base);

    case "invalid_enum_value":
      return t("validation.invalid_enum_value", locale, {
        ...base,
        options: issue.options.join(", "),
      });

    default:
      return t("validation.custom", locale, base);
  }
}

