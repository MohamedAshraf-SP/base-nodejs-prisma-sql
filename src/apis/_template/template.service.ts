import { BaseService } from "@core/base";
import { R } from "@shared/i18n";
import type { TemplateRepository } from "./template.repository";
// import type { CreateTemplateDto, UpdateTemplateDto, Template } from "./template.types";

// ============================================
// [Template] Business Logic
// ============================================
// Extends BaseService which provides:
//   getAll, getById (with NotFoundError), create, update, remove
//
// You only need to:
//   1. Pass the repository and R.<RESOURCE> to super()
//   2. Override methods to add business rules (uniqueness checks, etc.)
//
// The 4th generic (TemplateRepository) types `this.repo` so you can
// call custom repo methods like this.repo.findByEmail() without casting.

export class TemplateService extends BaseService<any, any, any, TemplateRepository> {
  // Replace <any, any, any, ...> with <Template, CreateTemplateDto, UpdateTemplateDto, ...>

  constructor(repo: TemplateRepository) {
    super(repo, R.RESOURCE); // replace R.RESOURCE with your resource key e.g. R.USER
  }

  // Override to add business logic:
  //
  // async create(data: CreateTemplateDto) {
  //   const existing = await this.repo.findByField(data.field);
  //   if (existing) throw new ConflictError(this.resourceKey, "field", data.field);
  //   return this.repo.create(data);
  // }
}
