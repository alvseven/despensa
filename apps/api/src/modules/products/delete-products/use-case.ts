import { productsRepository } from '@/shared/database/repositories/products.ts';

import type { DeleteProductInput } from './schemas.ts';

export async function deleteProduct({ id, accountId }: DeleteProductInput) {
  await productsRepository().deleteProductById({ id, accountId });
}
