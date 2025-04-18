import { z } from 'zod';

export const authenticateWithGoogleRequestSchema = z.object({
  code: z.string()
});

export type AuthenticateWithGoogleInput = z.infer<typeof authenticateWithGoogleRequestSchema>;
