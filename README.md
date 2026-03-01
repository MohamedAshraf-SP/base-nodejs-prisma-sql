# Developer Guide

Welcome to the **Service Platform** codebase. This guide covers everything you need to start building features.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Folder Structure](#2-folder-structure)
3. [Getting Started](#3-getting-started)
4. [Architecture](#4-architecture)
5. [Adding a New API Module](#5-adding-a-new-api-module)
6. [Database Service](#6-database-service)
7. [Error Handling](#7-error-handling)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Validation](#9-validation)
10. [API Response Format](#10-api-response-format)
11. [Middleware](#11-middleware)
12. [Environment Configuration](#12-environment-configuration)
13. [Logging](#13-logging)
14. [Graceful Shutdown](#14-graceful-shutdown)
15. [Conventions & Rules](#15-conventions--rules)

---

## 1. Tech Stack

| Layer        | Technology                |
|--------------|---------------------------|
| Runtime      | Node.js + TypeScript 5    |
| Framework    | Express 4                 |
| Database     | PostgreSQL + Prisma 7     |
| Validation   | Zod                       |
| Security     | Helmet + CORS             |
| i18n         | Custom (JSON-based, EN/AR)|

---

## 2. Folder Structure

```
src/
├── apis/                              # Feature modules (one folder per resource)
│   ├── _template/                     # Copy this to create a new module
│   ├── user/                          # User CRUD (working example)
│   │   ├── user.types.ts              #   TypeScript interfaces
│   │   ├── user.validations.ts        #   Zod schemas
│   │   ├── user.repository.ts         #   Database queries
│   │   ├── user.service.ts            #   Business logic
│   │   ├── user.controller.ts         #   HTTP handlers
│   │   └── user.router.ts             #   Router factory (createUserRouter)
│   ├── consts/                        # Constants CRUD (same pattern)
│   └── index.ts                       # Register all router factories here
│
├── core/                              # Framework code you build on
│   ├── base/                          #   BaseRepository, BaseService, BaseController
│   └── errors/                        #   AppError hierarchy (NotFound, Conflict, Gone, etc.)
│
├── shared/                            # Shared across all modules
│   ├── middleware/                     #   asyncHandler, validate, validateId, requestLogger, errorHandler
│   ├── i18n/                          #   Translation engine + locale files
│   ├── utils/                         #   Response helpers, structured logger
│   └── types/                         #   ApiResponse, PaginatedResult, etc.
│
├── infra/                             # Infrastructure & external services
│   ├── config/                        #   Zod-validated environment variables
│   ├── database/                      #   DB abstraction (contracts + Prisma impl)
│   │   ├── db.interfaces.ts           #     IDatabaseService, ModelDelegate, DatabaseClient
│   │   ├── database.service.ts        #     PrismaDatabaseService (the only Prisma-aware file)
│   │   └── prisma.ts                  #     Singleton Prisma client
│   ├── cache/                         #   Caching layer (placeholder)
│   ├── queue/                         #   Message queue (placeholder)
│   └── external-services/             #   Payment, email, SMS, storage (s3..) ,(JDK only)
│
├── app.ts                             # Express app factory
└── server.ts                          # Entry point (starts HTTP listener + graceful shutdown)
```

### Path Aliases

Use these instead of relative paths:

```typescript
import { BaseRepository } from "@core/base";
import { NotFoundError }  from "@core/errors";
import { db }             from "@infra/database";
import { env }            from "@infra/config";
import { asyncHandler, validateId } from "@shared/middleware";
import { t, R }           from "@shared/i18n";
import { sendSuccess }    from "@shared/utils/response";
import { logger }         from "@shared/utils/logger";
```

---

## 3. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or via Docker)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env from the example
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Generate Prisma client
npm run db:generate

# 4. Run database migrations
npm run db:migrate

# 5. Start dev server (hot reload)
npm run dev
```

### NPM Scripts

| Command            | Description                           |
|--------------------|---------------------------------------|
| `npm run dev`      | Start dev server with hot reload      |
| `npm run build`    | Compile TypeScript to `dist/`         |
| `npm start`        | Run compiled app (`dist/server.js`)   |
| `npm run db:generate` | Generate Prisma client types       |
| `npm run db:migrate`  | Create + apply database migration   |
| `npm run db:push`     | Push schema without migration file  |
| `npm run db:studio`   | Open Prisma Studio (DB browser)     |
| `npm run lint`     | Run ESLint                            |
| `npm run typecheck`| Type-check without emitting files     |

---

## 4. Architecture

### Request Flow

```
HTTP Request
  │
  ▼
Middleware       ── requestLogger → helmet → cors → json → localeMiddleware
  │
  ▼
Router           ── validateId + validate(schema) middleware
  │
  ▼
Controller       ── parse req, call service, send response
  │
  ▼
Service          ── business rules, orchestration
  │
  ▼
Repository       ── database queries (via ModelDelegate)
  │
  ▼
Database         ── IDatabaseService (Prisma implementation)
```

### Generic Base Classes

Every module inherits from three base classes that provide **standard CRUD for free**:

| Base Class       | Provides                                                  |
|------------------|-----------------------------------------------------------|
| `BaseRepository` | `findAll`, `findAllPaginated`, `findById`, `create`, `update`, `remove`, `forceRemove`, `count`, `where()` helper |
| `BaseService`    | `getAll`, `getAllPaginated`, `getById` (throws NotFound), `create`, `update`, `remove` |
| `BaseController` | `list` (auto-pagination from query), `getById`, `create`, `update`, `remove` |

**You only override what's different.** For example, `UserService` overrides `create` to check email uniqueness. Everything else is inherited.

### Database Abstraction

`@prisma/client` is **never imported** outside `infra/database/`. Everything else depends on these interfaces:

```typescript
// What the app sees (from db.interfaces.ts):
interface IDatabaseService {
  client: DatabaseClient;                                    // db.client.user, db.client.const
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  healthCheck(): Promise<void>;
  disconnect(): Promise<void>;
}
```

**To swap database engines later:** create a new implementation of `IDatabaseService`, change one export in `infra/database/index.ts`. Zero changes anywhere else.

### Router Factory Pattern

Routers are **factory functions** that receive the database client as an argument. This makes them testable (pass a mock) and free of module-level side effects:

```typescript
// user.router.ts
export function createUserRouter(db: DatabaseClient): Router {
  const repository = new UserRepository(db);
  const service    = new UserService(repository);
  const controller = new UserController(service);

  const router = Router();
  router.get("/",    asyncHandler(controller.list));
  router.get("/:id", validateId, asyncHandler(controller.getById));
  // ...
  return router;
}
```

Registered in `apis/index.ts`:

```typescript
export function registerApis(app: Express): void {
  app.use("/api/users", createUserRouter(db.client));
  app.use("/api/consts", createConstsRouter(db.client));
}
```

---

## 5. Adding a New API Module

Full example: creating a **Products** module.

### Step 1 — Copy the Template

```bash
cp -r src/apis/_template src/apis/products
```

Rename all files: `template.*` to `products.*`.

### Step 2 — Define Types

```typescript
// src/apis/products/products.types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProductDto {
  name: string;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
}
```

### Step 3 — Add Validations

```typescript
// src/apis/products/products.validations.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  price: z.number().positive("Price must be positive"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  price: z.number().positive().optional(),
});
```

### Step 4 — Create Repository

```typescript
// src/apis/products/products.repository.ts
import type { DatabaseClient } from "@infra/database";
import { BaseRepository } from "@core/base";
import type { CreateProductDto, UpdateProductDto, Product } from "./products.types";

export class ProductRepository extends BaseRepository<Product, CreateProductDto, UpdateProductDto> {
  // Set default ordering — applied to findAll() and findAllPaginated() automatically
  protected defaultOrder = { createdAt: "desc" };

  constructor(db: DatabaseClient) {
    super(db.product, { softDelete: true });
  }

  // Custom queries use this.where() to respect soft deletes
  async findByName(name: string): Promise<Product | null> {
    return this.model.findUnique({ where: this.where({ name }) });
  }
}
```

> **That's it!** No need to override `findAll` or `findAllPaginated` — the `defaultOrder` property handles ordering automatically. The `where()` helper merges your conditions with the soft-delete filter.

### Step 5 — Create Service

```typescript
// src/apis/products/products.service.ts
import { BaseService } from "@core/base";
import { ConflictError } from "@core/errors";
import { R } from "@shared/i18n";
import type { ProductRepository } from "./products.repository";
import type { CreateProductDto, UpdateProductDto, Product } from "./products.types";

export class ProductService extends BaseService<Product, CreateProductDto, UpdateProductDto, ProductRepository> {
  constructor(repo: ProductRepository) {
    super(repo, R.PRODUCT);
  }

  // Override to add business logic
  async create(data: CreateProductDto): Promise<Product> {
    const existing = await this.repo.findByName(data.name);
    if (existing) throw new ConflictError(R.PRODUCT, "name", data.name);
    return this.repo.create(data);
  }
}
```

### Step 6 — Create Controller

```typescript
// src/apis/products/products.controller.ts
import { BaseController } from "@core/base";
import type { ProductService } from "./products.service";
import type { CreateProductDto, UpdateProductDto, Product } from "./products.types";

export class ProductController extends BaseController<Product, CreateProductDto, UpdateProductDto, ProductService> {
  constructor(service: ProductService) {
    super(service);
  }
  // Inherits: list, getById, create, update, remove
  // Add custom endpoints here if needed
}
```

### Step 7 — Wire the Router (Factory)

```typescript
// src/apis/products/products.router.ts
import { Router } from "express";
import type { DatabaseClient } from "@infra/database";
import { asyncHandler, validate, validateId } from "@shared/middleware";
import { createProductSchema, updateProductSchema } from "./products.validations";
import { ProductRepository } from "./products.repository";
import { ProductService } from "./products.service";
import { ProductController } from "./products.controller";

export function createProductsRouter(db: DatabaseClient): Router {
  const repository = new ProductRepository(db);
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  const router = Router();

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateId, asyncHandler(controller.getById));
  router.post("/", validate(createProductSchema), asyncHandler(controller.create));
  router.patch("/:id", validateId, validate(updateProductSchema), asyncHandler(controller.update));
  router.delete("/:id", validateId, asyncHandler(controller.remove));

  return router;
}
```

### Step 8 — Register the Router

```typescript
// src/apis/index.ts
import { createProductsRouter } from "./products/products.router";

export function registerApis(app: Express): void {
  app.use("/api/users", createUserRouter(db.client));
  app.use("/api/consts", createConstsRouter(db.client));
  app.use("/api/products", createProductsRouter(db.client));   // <-- add this
}
```

### Step 9 — Create Prisma Model

```prisma
// prisma/models/product.prisma
model Product {
  id        String    @id @default(uuid())
  name      String    @unique
  price     Float
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("products")
}
```

### Step 10 — Add i18n Resource Key

```json
// src/shared/i18n/locales/en/resources.json
{
  "user": "User",
  "resource": "Resource",
  "const": "Constant",
  "product": "Product"       // <-- add this
}
```

Also add the Arabic translation in `locales/ar/resources.json`.

### Step 11 — Migrate

```bash
npm run db:migrate
```

**Done!** Your new module now has full CRUD with pagination, soft deletes, validation, i18n error messages, UUID param validation, request logging, and standardized response format.


---

## 6. Database Service

### Accessing Models

```typescript
import { db } from "@infra/database";

// db.client gives you access to all model delegates
db.client.user    // → ModelDelegate for User table
db.client.const   // → ModelDelegate for Const table
db.client.product // → ModelDelegate for Product table
```

### Pagination

Pagination is automatic. Clients control it via query parameters:

```
GET /api/users                    → returns all users (array)
GET /api/users?page=1             → returns page 1, 20 items per page (default)
GET /api/users?page=2&limit=5     → returns page 2, 5 items per page
```

**Validation:** `page` and `limit` are validated automatically. Invalid values (`?page=abc`, `?page=-1`, `?page=0`) are ignored and fall back to returning all records. `limit` is capped at **100** to prevent abuse.

Paginated response shape:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 47,
    "page": 2,
    "limit": 5,
    "totalPages": 10
  }
}
```

Use pagination in code:

```typescript
// In a service or anywhere
const allUsers = await userService.getAll();                          // User[]
const page     = await userService.getAllPaginated({ page: 1, limit: 5 }); // PaginatedResult<User>
```

### Default Ordering

Set `defaultOrder` in your repository to automatically apply ordering to both `findAll()` and `findAllPaginated()`:

```typescript
export class ProductRepository extends BaseRepository<...> {
  protected defaultOrder = { createdAt: "desc" };   // newest first
  // ...
}
```

No need to override `findAll` or `findAllPaginated` — the base class uses `defaultOrder` automatically.

### Soft Deletes

Enable per repository by passing `{ softDelete: true }`:

```typescript
export class ProductRepository extends BaseRepository<...> {
  constructor(db: DatabaseClient) {
    super(db.product, { softDelete: true });
  }
}
```

When enabled:
- `remove(id)` → sets `deletedAt = now()` (row stays in DB)
- `findAll()`, `findById()`, `count()` → auto-exclude rows where `deletedAt IS NOT NULL`
- `forceRemove(id)` → always hard-deletes the row

> **Default is `false`** — soft deletes are opt-in. Pass `{ softDelete: true }` explicitly for modules that need it.

### The `where()` Helper

Use `this.where()` in custom queries to automatically include the soft-delete filter:

```typescript
// ✅ Correct — uses where() helper, excludes deleted rows
async findByEmail(email: string): Promise<User | null> {
  return this.model.findUnique({ where: this.where({ email }) });
}

// ❌ Wrong — bypasses soft-delete filter, finds deleted users too
async findByEmail(email: string): Promise<User | null> {
  return this.model.findUnique({ where: { email } });
}
```

`this.where({ email })` merges to `{ deletedAt: null, email }` when soft-delete is enabled, or just `{ email }` when it's not.

### Transactions

Run multiple operations atomically:

```typescript
import { db } from "@infra/database";

const result = await db.transaction(async (tx) => {
  // tx is a DatabaseClient — same shape as db.client
  const userRepo = new UserRepository(tx);
  const profileRepo = new ProfileRepository(tx);

  const user = await userRepo.create({ name: "Ali", email: "ali@test.com" });
  await profileRepo.create({ userId: user.id, bio: "Hello" });

  return user;
  // If anything throws inside this function, ALL operations roll back
});
```

### Swapping the Database Engine

To replace Prisma with TypeORM, Knex, or any other engine:

1. Create a new file: `infra/database/typeorm.service.ts` implementing `IDatabaseService`
2. Change one export in `infra/database/index.ts`
3. **Zero changes** in `apis/`, `core/`, `shared/`, or `server.ts`

---

## 7. Error Handling

### Error Classes

All errors extend `AppError` and are auto-translated by the global `errorHandler` middleware:

| Class                | Status | Usage                                                       |
|----------------------|--------|-------------------------------------------------------------|
| `BadRequestError`    | 400    | `throw new BadRequestError()`                               |
| `ValidationError`    | 400    | `throw new ValidationError(zodErrors)` (used by middleware) |
| `UnauthorizedError`  | 401    | `throw new UnauthorizedError()`                             |
| `ForbiddenError`     | 403    | `throw new ForbiddenError()`                                |
| `NotFoundError`      | 404    | `throw new NotFoundError(R.USER)`                           |
| `ConflictError`      | 409    | `throw new ConflictError(R.USER, "email", "ali@test.com")`  |
| `GoneError`          | 410    | `throw new GoneError(R.USER)` (permanently deleted)         |
| `TooManyRequestsError`| 429   | `throw new TooManyRequestsError()`                          |
| `InternalServerError`| 500    | `throw new InternalServerError(details?)`                   |

### How It Works

1. You **throw** an error anywhere (service, repository, middleware)
2. `asyncHandler` catches it and passes to Express error handler
3. `errorHandler` translates the message using `req.locale` (from Accept-Language header)
4. Unhandled (non-AppError) exceptions are logged via the structured `logger` and return a generic 500
5. Client receives a consistent JSON response:

```json
{
  "success": false,
  "message": "User with email 'ali@test.com' already exists",
  "errors": null
}
```

### Usage Examples

```typescript
import { NotFoundError, ConflictError, GoneError } from "@core/errors";
import { R } from "@shared/i18n";

// In a service:
async create(data: CreateUserDto) {
  const existing = await this.repo.findByEmail(data.email);
  if (existing) {
    throw new ConflictError(R.USER, "email", data.email);
    // → 409: "User with email 'ali@test.com' already exists"
  }
  return this.repo.create(data);
}

// Permanently deleted resource:
throw new GoneError(R.USER);
// → 410: "User not found"

// getById already throws NotFoundError automatically (from BaseService)
const user = await this.getById(id);
// → 404: "User not found" (if not exists)
```

---

## 8. Internationalization (i18n)

### How It Works

- Translations live in `src/shared/i18n/locales/{locale}/{namespace}.json`
- Three namespaces: `common`, `validation`, `resources`
- Client sends `Accept-Language: ar` header → responses come in Arabic
- Missing translation files don't crash the app — they log a warning and fall back gracefully

### Adding a Resource Key

1. Add to `locales/en/resources.json`:
   ```json
   { "product": "Product" }
   ```

2. Add to `locales/ar/resources.json`:
   ```json
   { "product": "المنتج" }
   ```

3. Use in code — the `R` constant auto-generates:
   ```typescript
   import { R } from "@shared/i18n";

   super(repo, R.PRODUCT);                    // in service constructor
   throw new NotFoundError(R.PRODUCT);         // → "Product not found" (EN)
   throw new ConflictError(R.PRODUCT, "name", "Widget"); // → "Product with name 'Widget' already exists"
   ```

### Translation Function

```typescript
import { t, R } from "@shared/i18n";

// Direct translation with interpolation:
t("common.created", "en", { resource: R.USER });
// → "User created successfully"

t("common.created", "ar", { resource: R.USER });
// → Arabic equivalent
```

### Common Translation Keys

| Key                      | EN Template                                              |
|--------------------------|----------------------------------------------------------|
| `common.created`         | `{{resource}} created successfully`                      |
| `common.updated`         | `{{resource}} updated successfully`                      |
| `common.deleted`         | `{{resource}} deleted successfully`                      |
| `common.notFound`        | `{{resource}} not found`                                 |
| `common.conflict`        | `{{resource}} with {{field}} '{{value}}' already exists` |
| `common.badRequest`      | `Bad request`                                            |
| `common.unauthorized`    | `Unauthorized`                                           |
| `common.forbidden`       | `Forbidden`                                              |
| `common.validationFailed`| `Validation failed`                                      |
| `common.internalError`   | `Internal server error`                                  |

---

## 9. Validation

### Creating Schemas

Each module has a `*.validations.ts` file using Zod:

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1).max(255).optional(),
});
```

### Using in Router

```typescript
import { validate, validateId } from "@shared/middleware";
import { createUserSchema } from "./user.validations";

router.post("/", validate(createUserSchema), asyncHandler(controller.create));
router.patch("/:id", validateId, validate(updateUserSchema), asyncHandler(controller.update));
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "name", "message": "Name is required" }
  ]
}
```

---

## 10. API Response Format

All responses follow a standard envelope:

### Success Response

```typescript
sendSuccess(res, data);                        // 200
sendSuccess(res, data, "User created", 201);   // 201 with message
```

```json
{
  "success": true,
  "data": { "id": "...", "name": "Ali", "email": "ali@test.com" },
  "message": "User created successfully"
}
```

### Paginated Response

```typescript
sendPaginated(res, paginatedResult);
```

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "User not found",
  "errors": null
}
```

---

## 11. Middleware

### Built-in Middleware Stack

Applied automatically in `app.ts` (in order):

| Middleware         | Purpose                                         |
|--------------------|-------------------------------------------------|
| `helmet()`         | Security headers                                |
| `cors()`           | CORS with configurable origin (`CORS_ORIGIN`)   |
| `express.json()`   | JSON body parsing (capped at **10kb**)          |
| `requestLogger`    | Logs `[http] GET /api/users 200 12ms`           |
| `localeMiddleware` | Sets `req.locale` from `Accept-Language` header |
| `errorHandler`     | Global error handler (must be last)             |

### Route-Level Middleware

| Middleware        | Purpose                                           | Usage                                              |
|-------------------|---------------------------------------------------|----------------------------------------------------|
| `validateId`      | Validates `:id` param is a UUID                   | `router.get("/:id", validateId, asyncHandler(...))` |
| `validate(schema)`| Validates `req.body` against a Zod schema         | `router.post("/", validate(createSchema), ...)`     |
| `asyncHandler`    | Catches thrown errors and passes to `errorHandler` | Wrap every controller method                        |

### validateId

All `:id` route params are validated as UUIDs before reaching the controller:

```typescript
// In router:
router.get("/:id", validateId, asyncHandler(controller.getById));
router.patch("/:id", validateId, validate(updateSchema), asyncHandler(controller.update));
router.delete("/:id", validateId, asyncHandler(controller.remove));
```

Invalid IDs return:
```json
{ "success": false, "message": "Bad request", "errors": { "id": "Invalid ID format — expected UUID" } }
```

---

## 12. Environment Configuration

All environment variables are validated at startup using Zod in `src/infra/config/env.ts`.

### Current Variables

| Variable       | Type    | Default       | Required |
|----------------|---------|---------------|----------|
| `NODE_ENV`     | string  | `development` | No       |
| `PORT`         | number  | `3000`        | No       |
| `DATABASE_URL` | string  | —             | Yes      |
| `CORS_ORIGIN`  | string  | `*`           | No       |

### CORS Configuration

Set `CORS_ORIGIN` in your `.env` to restrict allowed origins:

```bash
# Development (allow all)
CORS_ORIGIN=*

# Production (restrict to your domain)
CORS_ORIGIN=https://myapp.com
```

### Adding a New Variable

1. Add to the schema in `src/infra/config/env.ts`:
   ```typescript
   const envSchema = z.object({
     // ... existing
     SMTP_HOST: z.string(),
     SMTP_PORT: z.coerce.number().default(587),
   });
   ```

2. Add to `.env.example`:
   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   ```

3. Use anywhere:
   ```typescript
   import { env } from "@infra/config";
   console.log(env.SMTP_HOST);
   ```

If a required variable is missing, the app **fails immediately at startup** with a clear error message. No silent runtime surprises.

---

## 13. Logging

### Structured Logger

Use the built-in structured logger instead of raw `console.log`:

```typescript
import { logger } from "@shared/utils/logger";

logger.info("Server started", { port: 3000 });
// → {"level":"info","time":"2025-01-15T12:00:00.000Z","message":"Server started","port":3000}

logger.warn("Rate limit approaching", { current: 95, max: 100 });
// → {"level":"warn","time":"...","message":"Rate limit approaching","current":95,"max":100}

logger.error("DB query failed", err);
// → {"level":"error","time":"...","message":"DB query failed","error":"...","stack":"..."}
```

The logger outputs JSON — ideal for log aggregation tools (CloudWatch, Datadog, ELK).

> **Future:** Replace with Winston or Pino when you need log rotation, transports, or log levels.

### Request Logging

Every HTTP request is logged automatically by the `requestLogger` middleware:

```
[http] GET /api/users 200 12ms
[http] POST /api/users 201 34ms
[http] GET /api/users/invalid-id 400 2ms
```

---

## 14. Graceful Shutdown

The server handles shutdown signals properly in `server.ts`:

- **SIGTERM / SIGINT** → stops accepting new connections, disconnects DB, then exits
- **Unhandled Rejection** → logs the error (keeps running)
- **Uncaught Exception** → logs the error and exits (unrecoverable)
- **Timeout** → forces exit after 10 seconds if graceful shutdown hangs

This ensures database connections are always closed cleanly, preventing connection leaks in production.

### Health Check

```
GET /health
```

Returns:
```json
{ "status": "ok", "uptime": 3600 }
```

Or if the DB is unreachable:
```json
{ "status": "unhealthy" }    // HTTP 503
```

---

## 15. Conventions & Rules

### File Naming

```
module.layer.ts
```

Examples: `user.service.ts`, `user.repository.ts`, `user.validations.ts`, `user.types.ts`

### Class Naming

PascalCase, matching the file:

| File                    | Class                |
|-------------------------|----------------------|
| `user.repository.ts`   | `UserRepository`     |
| `user.service.ts`      | `UserService`        |
| `user.controller.ts`   | `UserController`     |
| `consts.repository.ts` | `ConstsRepository`   |

### Import Rules

- **Always** use path aliases (`@core`, `@shared`, `@apis`, `@infra`) — never relative `../../`
- **Never** import `@prisma/client` outside `infra/database/`
- Import types with `import type` when possible

### Router Rules

- Routers **must** be factory functions: `export function createXxxRouter(db: DatabaseClient): Router`
- **Never** create module-level instances (no side effects at import time)
- Add `validateId` middleware on every `/:id` route
- Add `validate(schema)` middleware on every `POST` / `PATCH` route

### Controller Rules

- Use **arrow functions** for all handlers (preserves `this` when passed to `asyncHandler`)
- Don't call `res.json()` directly — use `sendSuccess()` or `sendPaginated()`

### Repository Rules

- Pass `{ softDelete: true }` for modules that need soft deletes (default is `false`)
- Set `protected defaultOrder = { createdAt: "desc" }` — don't override `findAll`/`findAllPaginated`
- Add `deletedAt DateTime? @map("deleted_at")` to the Prisma model
- Use `this.where()` in **all** custom queries to respect soft deletes:
  ```typescript
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: this.where({ email }) });
    //                                    ^^^^^^^^^^^^^^^^^^^^^^^
    //                 Without this, it would find deleted users too!
  }
  ```

### Service Rules

- Always call `this.getById(id)` before update/delete (it throws `NotFoundError` if missing)
- Use `R.RESOURCE` constants for error messages — never raw strings
- Override only the methods that need custom business logic

### General Rules

- Add i18n keys for every new resource and message
- Add Zod validation for every POST/PATCH route
- Register every new router factory in `apis/index.ts`
- Use `logger` from `@shared/utils/logger` instead of `console.log`/`console.error`
- Run `npm run typecheck` before pushing
