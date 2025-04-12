import { productsRepository } from '../repository.ts';
import type { GetProductByIdInput } from './schemas.ts';

import { errorResponse, successResponse } from '../../../shared/infra/http/api-response.ts';
import { STATUS_CODES } from '../../../shared/infra/http/status-code.ts';

export async function getProduct({ id, userId }: GetProductByIdInput) {
  const { getProductByIdAndUserId } = productsRepository();

  const productFound = await getProductByIdAndUserId({
    id,
    userId
  });

  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  return successResponse(productFound, STATUS_CODES.OK);
}
