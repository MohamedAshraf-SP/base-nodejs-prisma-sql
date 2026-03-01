import type { Request, Response } from "express";
import type { BaseService } from "./BaseService";
import { sendSuccess, sendPaginated } from "@shared/utils/response";
import { t } from "@shared/i18n";

/**
 * Base controller with standard CRUD endpoint handlers.
 *
 * Reads resourceKey directly from the service — no need to pass it here.
 *
 * Usage:
 *   class UserController extends BaseController<User, CreateUserDto, UpdateUserDto, UserService> {
 *     constructor(service: UserService) {
 *       super(service);
 *     }
 *   }
 *
 * Methods are arrow functions so `this` is preserved when passed to asyncHandler.
 */
export class BaseController<
  T,
  CreateDto,
  UpdateDto,
  S extends BaseService<T, CreateDto, UpdateDto, any> = BaseService<T, CreateDto, UpdateDto>,
> {
  constructor(protected readonly service: S) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : undefined;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 100)
      : undefined;

    if (page) {
      const result = await this.service.getAllPaginated({ page, limit });
      sendPaginated(res, result);
    } else {
      const items = await this.service.getAll();
      sendSuccess(res, items);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const item = await this.service.getById(req.params.id as string);
    sendSuccess(res, item);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const item = await this.service.create(req.body);
    const locale = req.locale ?? "en";
    sendSuccess(res, item, t("common.created", locale, { resource: this.service.resourceKey }), 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const item = await this.service.update(req.params.id as string, req.body);
    const locale = req.locale ?? "en";
    sendSuccess(res, item, t("common.updated", locale, { resource: this.service.resourceKey }));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.id as string);
    const locale = req.locale ?? "en";
    sendSuccess(res, null, t("common.deleted", locale, { resource: this.service.resourceKey }));
  };
}
