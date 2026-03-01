# Creating a New API Module

Follow these steps to add a new module to the platform.

## 1. Copy this folder

```
cp -r src/apis/_template src/apis/your-module
```

## 2. Rename files

Replace `template` with your module name in every file name:
- `template.router.ts`     -> `yourModule.router.ts`
- `template.controller.ts` -> `yourModule.controller.ts`
- `template.service.ts`    -> `yourModule.service.ts`
- `template.repository.ts` -> `yourModule.repository.ts`
- `template.schema.ts`     -> `yourModule.schema.ts`
- `template.types.ts`      -> `yourModule.types.ts`

## 3. What you actually need to write

Thanks to the base classes, most CRUD logic is inherited. Each layer
only needs the unique parts:

### types -- Define your domain interfaces
```ts
export interface Product { id: string; name: string; price: number; ... }
export interface CreateProductDto { name: string; price: number; }
export interface UpdateProductDto { name?: string; price?: number; }
```

### schema -- Define Zod validation
```ts
export const createProductSchema = z.object({ name: z.string(), price: z.number() });
```

### repository -- Extend BaseRepository, add custom queries
```ts
export class ProductRepository extends BaseRepository<Product, CreateProductDto, UpdateProductDto> {
  constructor(db: PrismaClient) { super(db.product); }

  async findByCategory(category: string) {
    return this.model.findMany({ where: { category } });
  }
}
```
**Inherited for free**: findAll, findById, create, update, remove, count

### service -- Extend BaseService, add business rules
```ts
export class ProductService extends BaseService<Product, CreateProductDto, UpdateProductDto, ProductRepository> {
  constructor(repo: ProductRepository) { super(repo, R.PRODUCT); }

  async create(data: CreateProductDto) {
    // custom validation, transformation, etc.
    return this.repo.create(data);
  }
}
```
**Inherited for free**: getAll, getById (with NotFoundError), create, update, remove

### controller -- Extend BaseController, add custom endpoints
```ts
export class ProductController extends BaseController<Product, CreateProductDto, UpdateProductDto, ProductService> {
  constructor(service: ProductService) { super(service); }
}
```
**Inherited for free**: list, getById, create (201), update, remove

### router -- Wire dependencies + routes
```ts
const repository = new ProductRepository(prisma);
const service    = new ProductService(repository);
const controller = new ProductController(service);

export const productRouter = Router();
productRouter.get("/",    asyncHandler(controller.list));
productRouter.get("/:id", asyncHandler(controller.getById));
productRouter.post("/",   validate(createProductSchema), asyncHandler(controller.create));
// ...
```

## 4. Add Prisma model

Create `prisma/models/product.prisma`, then run:
```
npm run db:migrate
```

## 5. Register the router

Open `src/apis/index.ts` and register your new router:

```ts
app.use("/api/products", productRouter);
```

## Layer Responsibilities

| Layer      | Does                                   | Does NOT                          |
|------------|----------------------------------------|-----------------------------------|
| Router     | DI wiring, HTTP verbs, middleware chain| Business logic, DB queries        |
| Controller | Parse req, call service, send response | DB queries, complex logic         |
| Service    | Business rules, orchestration          | Touch req/res, direct DB access   |
| Repository | Prisma queries, data mapping           | Business logic, HTTP concerns     |
| Schema     | Zod validation shapes                  | Anything else                     |
| Types      | TypeScript interfaces for the domain   | Anything else                     |
