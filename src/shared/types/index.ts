import type { Request, Response, NextFunction } from "express";
import type { Locale } from "../i18n";

// ============================================
// Express augmentation
// ============================================
declare global {
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

// ============================================
// Standardized API response shape
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

// ============================================
// Pagination
// ============================================
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Express helpers
// ============================================
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
