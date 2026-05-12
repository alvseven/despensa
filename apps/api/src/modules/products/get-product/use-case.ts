import type { GetProductByIdInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function getProduct({ id, accountId }: GetProductByIdInput) {
  const { getProductByIdAndAccountId } = productsRepository();

  const productFound = await getProductByIdAndAccountId({ id, accountId });

  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  return successResponse(productFound, STATUS_CODES.OK);
}
