import type { CreateProductInput } from './schemas.ts';

import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';

export async function createProduct({ notifications, ...product }: CreateProductInput) {
  const { createProduct } = productsRepository();
  const { createNotification } = notificationsRepository();

  const createdProduct = await createProduct(product);

  for (const notifyAt of notifications) {
    await createNotification({
      notifyAt,
      productId: createdProduct.id,
      userId: product.userId
    });

    // TODO - add logging
  }

  return successResponse(createdProduct, 201);
}
