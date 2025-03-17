import { z } from "zod";

export const createProductRequestSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  buyedAt: z.string(), // TODO - add date validation (it can be in the future) format: YYYY-MM-DD
  category: z.string(),
  expiresAt: z.string(), // TODO - add date validation (it can be in the past) format: YYYY-MM-DD
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;

export const getProductByIdRequestSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export type GetProductByIdInput = z.infer<typeof getProductByIdRequestSchema>;

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).optional(),
  buyedAt: z.string(), // TODO - add date validation (it can be in the future) format: YYYY-MM-DD
  category: z.string(),
  expiresAt: z.string(), // TODO - add date validation (it can be in the past) format: YYYY-MM-DD
});

export type UpdateProductByIdInput = z.infer<
  typeof updateProductByIdRequestSchema
>;

export const deleteProductByIdRequestSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export type DeleteProductByIdInput = z.infer<
  typeof deleteProductByIdRequestSchema
>;
