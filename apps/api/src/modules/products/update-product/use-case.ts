import type { UpdateProductByIdInput } from './schemas.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function updateProductById(product: UpdateProductByIdInput) {
  const { getProductByIdAndAccountId, updateProductById } = productsRepository();

  const productFound = await getProductByIdAndAccountId({
    id: product.id,
    accountId: product.accountId
  });

  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  const updatedProduct = await updateProductById(product);

  return successResponse(updatedProduct, STATUS_CODES.OK);
}
