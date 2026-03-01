import { Router } from "express";
import type { DatabaseClient } from "@infra/database";
import { asyncHandler, validate, validateId } from "@shared/middleware";
import { createUserSchema, updateUserSchema } from "./user.validations";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

/**
 * User module factory.
 *
 * Returns a fully wired Router. Dependencies are injected via `db`,
 * making this testable (pass a mock) and free of module-level side effects.
 */
export function createUserRouter(db: DatabaseClient): Router {
  const repository = new UserRepository(db);
  const service = new UserService(repository);
  const controller = new UserController(service);

  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateId, asyncHandler(controller.getById));
  router.post("/", validate(createUserSchema), asyncHandler(controller.create));
  router.patch("/:id", validateId, validate(updateUserSchema), asyncHandler(controller.update));
  router.delete("/:id", validateId, asyncHandler(controller.remove));

  return router;
}
