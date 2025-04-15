import { envs } from '@/shared/config/env.ts';
import { Resend } from 'resend';

export const mailer = new Resend(envs.RESEND_API_KEY);
