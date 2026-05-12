import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type Product, products } from '../schemas/products.ts';

type Tx = NodePgDatabase<typeof schema>;

export const productsRepository = (tx: Tx = db) => {
  const createProduct = async (
    product: Pick<Product, 'accountId' | 'name' | 'buyedAt' | 'category' | 'expiresAt'>
  ) => {
    const [createdProduct] = await tx.insert(products).values(product).returning();

    return createdProduct;
  };

  const getProductByIdAndAccountId = async ({
    id,
    accountId
  }: Pick<Product, 'id' | 'accountId'>) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.accountId, accountId)));

    return product;
  };

  const getProductsByAccountId = async ({ accountId }: Pick<Product, 'accountId'>) => {
    return await tx.select().from(products).where(eq(products.accountId, accountId));
  };

  const updateProductById = async ({
    id,
    accountId,
    ...product
  }: Partial<Pick<Product, 'name' | 'buyedAt' | 'category' | 'expiresAt'>> &
    Pick<Product, 'id' | 'accountId'>) => {
    const [updatedProduct] = await tx
      .update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.accountId, accountId)))
      .returning();

    return updatedProduct;
  };

  const deleteProductById = async ({ id, accountId }: Pick<Product, 'id' | 'accountId'>) => {
    return await tx
      .delete(products)
      .where(and(eq(products.id, id), eq(products.accountId, accountId)));
  };

  return {
    createProduct,
    getProductByIdAndAccountId,
    getProductsByAccountId,
    updateProductById,
    deleteProductById
  };
};

export type ProductsRepository = ReturnType<typeof productsRepository>;
