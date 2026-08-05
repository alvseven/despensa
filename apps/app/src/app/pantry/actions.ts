'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api-client';
import { createProduct } from '@/lib/products/api';
import { createProductFormSchema, resolveNotificationDates } from '@/lib/products/schemas';

export type AddProductState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAddProductState: AddProductState = { status: 'idle' };

export async function addProductAction(
  _previous: AddProductState,
  formData: FormData
): Promise<AddProductState> {
  const expiresAt = String(formData.get('expiresAt') ?? '');
  const leadTimes = formData
    .getAll('leadTimes')
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const parsed = createProductFormSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    buyedAt: String(formData.get('buyedAt') ?? ''),
    expiresAt,
    notifications: resolveNotificationDates(expiresAt, leadTimes)
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Confira os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  try {
    await createProduct(parsed.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: 'error',
        message: error.requestId ? `${error.message} (ref: ${error.requestId})` : error.message,
        fieldErrors: error.fieldErrors
      };
    }
    throw error;
  }

  revalidatePath('/pantry');

  return { status: 'success', message: 'Produto adicionado.' };
}
