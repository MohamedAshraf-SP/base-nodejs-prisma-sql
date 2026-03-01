import type { Response } from "express";
import type { ApiResponse, PaginatedResult } from "../types";

/**
 * Standardized response helpers.
 *
 * Every controller should use these instead of calling res.json() directly.
 * This guarantees a uniform envelope for all API consumers.
 *
 * Usage:
 *   sendSuccess(res, user, "User created", 201);
 *   sendPaginated(res, paginatedResult);
 *   sendError(res, "Something went wrong", 500);
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  const body: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResult<T>,
): void {
  res.status(200).json({ success: true, data: result });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
): void {
  const body: ApiResponse = { success: false, message, errors };
  res.status(statusCode).json(body);
}
