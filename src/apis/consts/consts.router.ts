import { Router } from "express";
import type { DatabaseClient } from "@infra/database";
import { asyncHandler, validate, validateId } from "@shared/middleware";
import { createConstSchema, updateConstSchema } from "./consts.validations";
import { ConstsRepository } from "./consts.repository";
import { ConstsService } from "./consts.service";
import { ConstsController } from "./consts.controller";

/**
 * Consts module factory.
 *
 * Returns a fully wired Router. Dependencies are injected via `db`,
 * making this testable (pass a mock) and free of module-level side effects.
 */
export function createConstsRouter(db: DatabaseClient): Router {
  const repository = new ConstsRepository(db);
  const service = new ConstsService(repository);
  const controller = new ConstsController(service);

  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateId, asyncHandler(controller.getById));
  router.post("/", validate(createConstSchema), asyncHandler(controller.create));
  router.patch("/:id", validateId, validate(updateConstSchema), asyncHandler(controller.update));
  router.delete("/:id", validateId, asyncHandler(controller.remove));

  return router;
}
