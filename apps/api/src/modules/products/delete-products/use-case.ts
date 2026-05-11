import type { DeleteProductInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function deleteProduct({ id, accountId }: DeleteProductInput) {
  const { getProductByIdAndAccountId, deleteProductById } = productsRepository();

  const productFound = await getProductByIdAndAccountId({ id, accountId });

  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  await deleteProductById({ id, accountId });

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
