import { BaseService } from "@core/base";
import { ConflictError } from "@core/errors";
import { R } from "@shared/i18n";
import type { ConstsRepository } from "./consts.repository";
import type { CreateConstDto, UpdateConstDto, Const } from "./consts.types";

export class ConstsService extends BaseService<Const, CreateConstDto, UpdateConstDto, ConstsRepository> {
  constructor(repo: ConstsRepository) {
    super(repo, R.CONST);
  }

  async create(data: CreateConstDto): Promise<Const> {
    const existing = await this.repo.findByKey(data.key);
    if (existing) throw new ConflictError(R.CONST, "key", data.key);
    return this.repo.create(data);
  }

  async update(id: string, data: UpdateConstDto): Promise<Const> {
    await this.getById(id);

    if (data.key) {
      const existing = await this.repo.findByKey(data.key);
      if (existing && existing.id !== id) {
        throw new ConflictError(R.CONST, "key", data.key);
      }
    }

    return this.repo.update(id, data);
  }
}
