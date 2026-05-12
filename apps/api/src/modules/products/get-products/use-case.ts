import type { GetProductsInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function getProducts({ accountId }: GetProductsInput) {
  const { getProductsByAccountId } = productsRepository();

  const products = await getProductsByAccountId({ accountId });

  return successResponse(products, STATUS_CODES.OK);
}
