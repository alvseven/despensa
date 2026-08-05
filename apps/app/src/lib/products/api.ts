import 'server-only';

import { apiFetch } from '../api-client';
import type { CreateProductInput, Product } from './schemas';

export function getProducts() {
  return apiFetch<Product[]>('/v1/products');
}

export function createProduct(input: CreateProductInput) {
  return apiFetch<Product>('/v1/products', { method: 'POST', body: input });
}
