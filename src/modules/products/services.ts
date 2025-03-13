import {
  errorResponse,
  successResponse,
} from "../../shared/helpers/api-response.ts";

import type { ProductsRepository } from "./repository.ts";

import type {
  CreateProductInput,
  DeleteProductByIdInput,
  GetProductByIdInput,
  UpdateProductByIdInput,
} from "./schemas.ts";

export function productsService(productsRepository: ProductsRepository) {
  async function createProduct(product: CreateProductInput) {
    const createdProduct = await productsRepository.createProduct(product);

    return successResponse(createdProduct, 201);
  }

  async function getProductById({ id }: GetProductByIdInput) {
    const productFound = await productsRepository.getProductById(id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!productFound) {
      return errorResponse("Product not found", 404);
    }

    return successResponse(productFound);
  }

  async function updateProductById(product: UpdateProductByIdInput) {
    const productFound = await productsRepository.getProductById(product.id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!productFound) {
      return errorResponse("Product not found", 404);
    }

    const updatedProduct = await productsRepository.updateProductById(product);

    return successResponse(updatedProduct, 200);
  }

  async function deleteProductById({ id }: DeleteProductByIdInput) {
    const productFound = await productsRepository.getProductById(id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!productFound) {
      return errorResponse("Product not found", 404);
    }

    await productsRepository.deleteProductById(id);

    return successResponse(true, 200); //  not used, and should be a 204;
  }

  return {
    createProduct,
    getProductById,
    updateProductById,
    deleteProductById,
  };
}
