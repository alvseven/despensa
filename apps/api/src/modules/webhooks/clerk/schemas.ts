import { z } from 'zod';

const emailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string().email()
});

export const clerkUserDataSchema = z.object({
  id: z.string(),
  primary_email_address_id: z.string().nullable(),
  email_addresses: z.array(emailAddressSchema),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string().nullable()
});

export const clerkUserDeletedDataSchema = z.object({
  id: z.string(),
  deleted: z.boolean().optional()
});

export const clerkEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user.created'), data: clerkUserDataSchema }),
  z.object({ type: z.literal('user.updated'), data: clerkUserDataSchema }),
  z.object({ type: z.literal('user.deleted'), data: clerkUserDeletedDataSchema })
]);

export type ClerkUserData = z.infer<typeof clerkUserDataSchema>;
export type ClerkUserDeletedData = z.infer<typeof clerkUserDeletedDataSchema>;
export type ClerkEvent = z.infer<typeof clerkEventSchema>;

export function resolvePrimaryEmail(data: ClerkUserData): string | null {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? null;
}

export function resolveDisplayName(data: ClerkUserData): string {
  return [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || 'Anonymous';
}
