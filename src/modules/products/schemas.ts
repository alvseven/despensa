import { z } from "zod";
import { zodCustomErrorMap } from "../../shared/dtos/zod-custom-error-map.ts";

export const createProductRequestSchema = z.object({
  name: z.string().min(1),
  buyedAt: z.string(),
  category: z.string(),
  expiresAt: z.string(),
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;

export const getProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

export type GetProductByIdInput = z.infer<typeof getProductByIdRequestSchema>;

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  buyedAt: z.string().optional(),
  category: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type UpdateProductByIdInput = z.infer<
  typeof updateProductByIdRequestSchema
>;

export const deleteProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteProductByIdInput = z.infer<
  typeof deleteProductByIdRequestSchema
>;
