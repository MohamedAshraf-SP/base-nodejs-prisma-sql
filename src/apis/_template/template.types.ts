// ============================================
// [Template] Domain Types
// ============================================
// Define TypeScript interfaces that represent your domain objects.
// These types are used across controller, service, and repository layers.
//
// TIP: Keep these pure -- no Prisma, Express, or Zod imports here.
//      This layer defines the "shape" of your domain.

export interface Template {
  id: string;
  // add your fields here
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateDto {
  // fields required to create a new record
}

export interface UpdateTemplateDto {
  // fields allowed for update (all optional)
}
