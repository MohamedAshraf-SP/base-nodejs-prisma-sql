import type { DatabaseClient } from "@infra/database";
import { BaseRepository } from "@core/base";
import type { CreateUserDto, UpdateUserDto, User } from "./user.types";

export class UserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> {
  protected defaultOrder = { createdAt: "desc" };

  constructor(db: DatabaseClient) {
    super(db.user, { softDelete: true });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: this.where({ email }) });
  }
}
