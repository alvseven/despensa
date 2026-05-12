import { productsRepository } from '@/shared/database/repositories/products.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

import type { DeleteProductInput } from './schemas.ts';

export async function deleteProduct({ id, accountId }: DeleteProductInput) {
  await productsRepository().deleteProductById({ id, accountId });
  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
