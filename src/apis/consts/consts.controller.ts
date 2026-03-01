import { BaseController } from "@core/base";
import type { ConstsService } from "./consts.service";
import type { CreateConstDto, UpdateConstDto, Const } from "./consts.types";

export class ConstsController extends BaseController<Const, CreateConstDto, UpdateConstDto, ConstsService> {
  constructor(service: ConstsService) {
    super(service);
  }
}
