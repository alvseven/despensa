import type { UpdateProductByIdInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function updateProductById(product: UpdateProductByIdInput) {
  const updated = await productsRepository().updateProductById(product);

  if (!updated) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  return successResponse(updated, STATUS_CODES.OK);
}
