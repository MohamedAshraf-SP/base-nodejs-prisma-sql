import { BaseController } from "@core/base";
import type { TemplateService } from "./template.service";
// import type { CreateTemplateDto, UpdateTemplateDto, Template } from "./template.types";

// ============================================
// [Template] Controller
// ============================================
// Extends BaseController which provides:
//   list, getById, create, update, remove
//
// You only need to:
//   1. Pass the service to super()
//   2. Add custom endpoints (e.g., search, bulk operations)
//   3. Override base handlers if the request/response shape differs

export class TemplateController extends BaseController<any, any, any, TemplateService> {
  // Replace <any, any, any, ...> with <Template, CreateTemplateDto, UpdateTemplateDto, ...>

  constructor(service: TemplateService) {
    super(service);
  }

  // All 5 CRUD handlers are inherited from BaseController.
  //
  // Add custom endpoints as arrow functions:
  //
  // search = async (req: Request, res: Response): Promise<void> => {
  //   const results = await this.service.search(req.query);
  //   sendSuccess(res, results);
  // };
}
