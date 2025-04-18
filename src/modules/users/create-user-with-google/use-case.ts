import { usersRepository } from '@/shared/database/repositories/users.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { oauth2, oauth2Client } from '@/shared/libs/googleapis.ts';
import type { CreateUserWithGoogleInput } from './schemas.ts';

export async function createUserWithGoogle({ code, phoneNumber }: CreateUserWithGoogleInput) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const { data: googleUser } = await oauth2.userinfo.get({
      auth: oauth2Client
    });

    if (!googleUser.email || !googleUser.id || !googleUser.name || !googleUser.picture) {
      return errorResponse('Failed to get user data from Google', STATUS_CODES.BAD_REQUEST);
    }

    const { getUserByEmailAndProviderId } = usersRepository();

    const user = await getUserByEmailAndProviderId(googleUser.email, googleUser.id);

    if (user) {
      return errorResponse('User already exists', STATUS_CODES.CONFLICT);
    }

    const { createUserWithGoogle } = usersRepository();

    const createdUser = await createUserWithGoogle({
      email: googleUser.email,
      name: googleUser.name,
      phoneNumber,
      providerId: googleUser.id,
      avatarUrl: googleUser.picture
    });

    return successResponse(createdUser, STATUS_CODES.CREATED);
  } catch (err) {
    console.error(err);

    return errorResponse('Failed to authenticate with Google', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
}
