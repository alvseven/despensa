import { eq } from "drizzle-orm";

import { db } from "../../shared/database/index.ts";
import {
  products,
  type Product,
} from "../../shared/database/schemas/products.ts";

export const productsRepository = () => {
  const createProduct = async (
    product: Pick<Product, "name" | "buyedAt" | "category" | "expiresAt">
  ) => {
    const [productCreated] = await db
      .insert(products)
      .values(product)
      .returning();

    return productCreated;
  };

  const getProductById = async (id: Product["id"]) => {
    const [productFound] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    return productFound;
  };

  const updateProductById = async ({
    id,
    ...product
  }: Partial<Pick<Product, "name" | "buyedAt" | "category" | "expiresAt">> &
    Pick<Product, "id">) => {
    const [productUpdated] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();

    return productUpdated;
  };

  const deleteProductById = async (id: Product["id"]) => {
    return db.delete(products).where(eq(products.id, id));
  };

  return {
    createProduct,
    getProductById,
    updateProductById,
    deleteProductById,
  };
};

export type ProductsRepository = ReturnType<typeof productsRepository>;
