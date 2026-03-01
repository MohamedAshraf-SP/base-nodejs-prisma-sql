import type { Express } from "express";
import { db } from "@infra/database";
import { createUserRouter } from "./user/user.router";
import { createConstsRouter } from "./consts/consts.router";

/**
 * API Registry
 *
 * Register every module router here. Each module exposes a factory
 * function that receives the database client — no module-level side effects.
 *
 * When you add a new module:
 *   1. Import its createXxxRouter factory
 *   2. Add one line:  app.use("/api/<name>", createXxxRouter(db.client));
 */
export function registerApis(app: Express): void {
  app.use("/api/users", createUserRouter(db.client));
  app.use("/api/consts", createConstsRouter(db.client));

  // Register new modules below this line:
  // app.use("/api/products", createProductsRouter(db.client));
}
