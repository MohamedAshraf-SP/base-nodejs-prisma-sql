import type { DatabaseClient } from "@infra/database";
import { BaseRepository } from "@core/base";
// import type { CreateTemplateDto, UpdateTemplateDto, Template } from "./template.types";

// ============================================
// [Template] Repository
// ============================================
// Extends BaseRepository which provides:
//   findAll (with optional pagination), findById, create, update, remove, count
//
// You only need to:
//   1. Pass the model delegate (db.template) to super()
//   2. Optionally enable soft deletes: super(db.template, { softDelete: true })
//   3. Add service-specific queries below (findByEmail, findBySlug, etc.)
//   4. Override base methods if you need custom behavior (ordering, includes, etc.)

export class TemplateRepository extends BaseRepository<any, any, any> {
  // Replace <any, any, any> with <Template, CreateTemplateDto, UpdateTemplateDto>

  constructor(db: DatabaseClient) {
    super((db as any).template); // replace 'template' with your model name
  }

  // Override findAll if you need custom ordering:
  // async findAll() {
  //   return this.model.findMany({ where: this.baseFilter, orderBy: { createdAt: "desc" } });
  // }

  // Add custom queries:
  // async findByEmail(email: string) {
  //   return this.model.findUnique({ where: { email } });
  // }
}
