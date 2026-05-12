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
