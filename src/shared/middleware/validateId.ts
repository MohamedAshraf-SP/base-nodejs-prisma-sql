import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@core/errors";

/**
 * Validates that `req.params.id` is a valid UUID v4.
 *
 * Usage (in router):
 *   router.get("/:id", validateId, asyncHandler(controller.getById));
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateId = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const id = req.params.id as string | undefined;

  if (!id || !UUID_REGEX.test(id)) {
    next(new BadRequestError({ id: "Invalid ID format — expected UUID" }));
    return;
  }

  next();
};
