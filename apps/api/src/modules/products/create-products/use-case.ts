import { db } from '@/shared/database/index.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';

import type { CreateProductInput } from './schemas.ts';

export async function createProduct({ notifications, ...product }: CreateProductInput) {
  const createdProduct = await db.transaction(async (tx) => {
    const { createProduct } = productsRepository(tx);
    const { createMany } = notificationsRepository(tx);

    const created = await createProduct(product);

    await createMany(
      notifications.map((notifyAt) => ({
        notifyAt,
        productId: created.id,
        accountId: product.accountId
      }))
    );

    return created;
  });

  return successResponse(createdProduct, 201);
}
