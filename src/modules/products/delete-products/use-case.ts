import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import type { DeleteProductInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function deleteProduct({ id, userId }: DeleteProductInput) {
  const { getProductByIdAndUserId, deleteProductById } = productsRepository();

  const productFound = await getProductByIdAndUserId({
    id,
    userId
  });

  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  await deleteProductById({ id, userId });

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
