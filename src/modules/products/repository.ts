import { and, eq } from 'drizzle-orm';

import { db } from '../../shared/database/index.ts';
import { type Product, products } from '../../shared/database/schemas/products.ts';

export const productsRepository = () => {
  const createProduct = async (
    product: Pick<Product, 'userId' | 'name' | 'buyedAt' | 'category' | 'expiresAt'>
  ) => {
    const [createdProduct] = await db.insert(products).values(product).returning().execute();

    return createdProduct;
  };

  const getProductByIdAndUserId = async ({ id, userId }: Pick<Product, 'id' | 'userId'>) => {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .execute();

    return product;
  };

  const getProductsByUserId = async ({ userId }: Pick<Product, 'userId'>) => {
    return await db.select().from(products).where(eq(products.userId, userId)).execute();
  };

  const updateProductById = async ({
    id,
    userId,
    ...product
  }: Partial<Pick<Product, 'name' | 'buyedAt' | 'category' | 'expiresAt'>> &
    Pick<Product, 'id' | 'userId'>) => {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning()
      .execute();

    return updatedProduct;
  };

  const deleteProductById = async ({ id, userId }: Pick<Product, 'id' | 'userId'>) => {
    return await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .execute();
  };

  return {
    createProduct,
    getProductByIdAndUserId,
    getProductsByUserId,
    updateProductById,
    deleteProductById
  };
};

export type ProductsRepository = ReturnType<typeof productsRepository>;
