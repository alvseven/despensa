import { productsRepository } from '../repository.ts';
import type { CreateProductInput } from './schemas.ts';

import { successResponse } from '../../../shared/infra/http/api-response.ts';

export async function createProduct(product: CreateProductInput) {
  const { createProduct } = productsRepository();

  const createdProduct = await createProduct(product);

  return successResponse(createdProduct, 201);
}
