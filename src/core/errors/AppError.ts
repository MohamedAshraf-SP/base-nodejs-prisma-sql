import type { TranslationKey, TranslationParams } from "@shared/i18n";
import { t } from "@shared/i18n";

/**
 * Base application error.
 *
 * Throw a subclass from any layer — the global errorHandler catches it,
 * translates the message into req.locale, and sends a consistent JSON response.
 *
 * .message always holds the English translation (useful for logs/debugger).
 * errorHandler re-translates using req.locale before sending to the client.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly details?: unknown;
  public readonly messageKey: TranslationKey;
  public readonly messageParams?: TranslationParams;

  constructor(
    messageKey: TranslationKey,
    statusCode: number,
    messageParams?: TranslationParams,
    details?: unknown,
  ) {
    super(t(messageKey, "en", messageParams)); // .message = English text
    this.statusCode = statusCode;
    this.messageKey = messageKey;
    this.messageParams = messageParams;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 400 Bad Request
 * Usage: throw new BadRequestError()
 *        throw new BadRequestError(details)
 */
export class BadRequestError extends AppError {
  constructor(details?: unknown) {
    super("common.badRequest", 400, undefined, details);
  }
}

/**
 * 400 Validation Failed — used by the validate middleware for Zod errors.
 * Usage: throw new ValidationError(zodFieldErrors)
 *   .message → "Validation failed"
 */
export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("common.validationFailed", 400, undefined, details);
  }
}

/**
 * 401 Unauthorized
 * Usage: throw new UnauthorizedError()
 */
export class UnauthorizedError extends AppError {
  constructor() {
    super("common.unauthorized", 401);
  }
}

/**
 * 403 Forbidden
 * Usage: throw new ForbiddenError()
 */
export class ForbiddenError extends AppError {
  constructor() {
    super("common.forbidden", 403);
  }
}

/**
 * 404 Not Found
 * Usage: throw new NotFoundError("resources.user")
 *   .message  → "User not found"
 *   client AR → "المستخدم غير موجود"
 */
export class NotFoundError extends AppError {
  constructor(resourceKey: TranslationKey) {
    super("common.notFound", 404, { resource: resourceKey });
  }
}

/**
 * 409 Conflict
 * Usage: throw new ConflictError("resources.user", "email", "x@y.com")
 *   .message  → "User with email 'x@y.com' already exists"
 *   client AR → "المستخدم بـemail 'x@y.com' موجود مسبقاً"
 */
export class ConflictError extends AppError {
  constructor(resourceKey: TranslationKey, field: string, value: string) {
    super("common.conflict", 409, { resource: resourceKey, field, value });
  }
}

/**
 * 410 Gone — resource was permanently deleted.
 * Usage: throw new GoneError("resources.user")
 */
export class GoneError extends AppError {
  constructor(resourceKey: TranslationKey) {
    super("common.notFound", 410, { resource: resourceKey });
  }
}

/**
 * 429 Too Many Requests
 * Usage: throw new TooManyRequestsError()
 */
export class TooManyRequestsError extends AppError {
  constructor() {
    super("common.badRequest", 429);
  }
}

/**
 * 500 Internal Server Error — unexpected failures.
 * Usage: throw new InternalServerError()
 *        throw new InternalServerError(details)
 */
export class InternalServerError extends AppError {
  constructor(details?: unknown) {
    super("common.internalError", 500, undefined, details);
  }
}
