import { envs } from '@/shared/config/env.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { oauth2, oauth2Client } from '@/shared/libs/googleapis.ts';
import { sign } from 'hono/jwt';
import type { AuthenticateWithGoogleInput } from './schemas.ts';

export async function authenticateWithGoogle({ code }: AuthenticateWithGoogleInput) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const { data: googleUser } = await oauth2.userinfo.get({
      auth: oauth2Client
    });

    if (!googleUser.email) {
      return errorResponse('Failed to get user email from Google', STATUS_CODES.BAD_REQUEST);
    }

    const { getUserByEmailAndProviderId } = usersRepository();

    if (!googleUser.id) {
      return errorResponse('Failed to get user id from Google', STATUS_CODES.BAD_REQUEST);
    }

    const user = await getUserByEmailAndProviderId(googleUser.email, googleUser.id);

    if (!user) {
      return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 100);

    const payload = {
      sub: { email: user.email, id: user.id },
      exp: currentTimeInSeconds + envs.JWT_EXPIRATION
    };

    const token = await sign(payload, envs.JWT_SECRET);

    return successResponse(
      {
        token
      },
      STATUS_CODES.OK
    );
  } catch (err) {
    console.error(err);

    return errorResponse('Failed to authenticate with Google', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
}
