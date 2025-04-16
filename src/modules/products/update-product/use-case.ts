import type { UpdateProductByIdInput } from './schemas.ts';

import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

import { productsRepository } from '@/shared/database/repositories/products.ts';

export async function updateProductById(product: UpdateProductByIdInput) {
  const { getProductByIdAndUserId, updateProductById } = productsRepository();

  const productFound = await getProductByIdAndUserId({
    id: product.id,
    userId: product.userId
  });
  if (!productFound) {
    return errorResponse('Product not found', STATUS_CODES.NOT_FOUND);
  }

  const updatedProduct = await updateProductById(product);

  return successResponse(updatedProduct, STATUS_CODES.OK);
}
