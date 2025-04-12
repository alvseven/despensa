import { productsRepository } from '../repository.ts';
import type { GetProductsInput } from './schemas.ts';

import { successResponse } from '../../../shared/infra/http/api-response.ts';
import { STATUS_CODES } from '../../../shared/infra/http/status-code.ts';

export async function getProducts({ userId }: GetProductsInput) {
  const { getProductsByUserId } = productsRepository();

  const products = await getProductsByUserId({
    userId
  });

  return successResponse(products, STATUS_CODES.OK);
}
