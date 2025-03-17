import { and, eq } from "drizzle-orm";

import { db } from "../../shared/database/index.ts";
import {
  products,
  type Product,
} from "../../shared/database/schemas/products.ts";

export const productsRepository = () => {
  const createProduct = async (
    product: Pick<
      Product,
      "userId" | "name" | "buyedAt" | "category" | "expiresAt"
    >
  ) => {
    const [productCreated] = await db
      .insert(products)
      .values(product)
      .returning()
      .execute();

    return productCreated;
  };

  const getProductByIdAndUserId = async ({
    id,
    userId,
  }: Pick<Product, "id" | "userId">) => {
    const [productFound] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .execute();

    return productFound;
  };

  const updateProductById = async ({
    id,
    userId,
    ...product
  }: Partial<Pick<Product, "name" | "buyedAt" | "category" | "expiresAt">> &
    Pick<Product, "id" | "userId">) => {
    const [productUpdated] = await db
      .update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning()
      .execute();

    return productUpdated;
  };

  const deleteProductById = async ({
    id,
    userId,
  }: Pick<Product, "id" | "userId">) => {
    return db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .execute();
  };

  return {
    createProduct,
    getProductByIdAndUserId,
    updateProductById,
    deleteProductById,
  };
};

export type ProductsRepository = ReturnType<typeof productsRepository>;
