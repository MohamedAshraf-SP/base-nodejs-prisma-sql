import { Router } from "express";
import type { DatabaseClient } from "@infra/database";
import { asyncHandler, validateId } from "@shared/middleware";
// import { validate } from "@shared/middleware";
// import { createTemplateSchema, updateTemplateSchema } from "./template.validations";
import { TemplateRepository } from "./template.repository";
import { TemplateService } from "./template.service";
import { TemplateController } from "./template.controller";

// ============================================
// [Template] Router Factory
// ============================================
// Returns a fully wired Router. Dependencies injected via `db`.
//
// In apis/index.ts:
//   app.use("/api/templates", createTemplateRouter(db.client));

export function createTemplateRouter(db: DatabaseClient): Router {
  const repository = new TemplateRepository(db);
  const service = new TemplateService(repository);
  const controller = new TemplateController(service);

  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateId, asyncHandler(controller.getById));

  // Add validate middleware when ready:
  // router.post("/", validate(createTemplateSchema), asyncHandler(controller.create));
  router.post("/", asyncHandler(controller.create));

  // router.patch("/:id", validateId, validate(updateTemplateSchema), asyncHandler(controller.update));
  router.patch("/:id", validateId, asyncHandler(controller.update));

  router.delete("/:id", validateId, asyncHandler(controller.remove));

  return router;
}
