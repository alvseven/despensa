import { envs } from '@/shared/config/env.ts';
import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  envs.GOOGLE_CLIENT_ID,
  envs.GOOGLE_CLIENT_SECRET,
  envs.GOOGLE_REDIRECT_URI
);

export const oauth2 = google.oauth2('v2');
