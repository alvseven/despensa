import type { CreateProductInput } from './schemas.ts';

import { db } from '@/shared/database/index.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';

export async function createProduct({ notifications, ...product }: CreateProductInput) {
  const createdProduct = await db.transaction(async (tx) => {
    const { createProduct } = productsRepository(tx);
    const { createNotification } = notificationsRepository(tx);

    const created = await createProduct(product);

    for (const notifyAt of notifications) {
      await createNotification({
        notifyAt,
        productId: created.id,
        accountId: product.accountId
      });
    }

    return created;
  });

  return successResponse(createdProduct, 201);
}
