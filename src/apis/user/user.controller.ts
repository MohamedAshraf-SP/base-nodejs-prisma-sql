import { BaseController } from "@core/base";
import type { UserService } from "./user.service";
import type { CreateUserDto, UpdateUserDto, User } from "./user.types";

export class UserController extends BaseController<User, CreateUserDto, UpdateUserDto, UserService> {
  constructor(service: UserService) {
    super(service);
  }
}
