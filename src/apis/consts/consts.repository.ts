import type { DatabaseClient } from "@infra/database";
import { BaseRepository } from "@core/base";
import type { CreateConstDto, UpdateConstDto, Const } from "./consts.types";

export class ConstsRepository extends BaseRepository<Const, CreateConstDto, UpdateConstDto> {
  protected defaultOrder = { createdAt: "desc" };

  constructor(db: DatabaseClient) {
    super(db.const, { softDelete: true });
  }

  async findByKey(key: string): Promise<Const | null> {
    return this.model.findUnique({ where: this.where({ key }) });
  }
}