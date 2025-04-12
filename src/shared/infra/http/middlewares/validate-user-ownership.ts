import { createMiddleware } from 'hono/factory';

export const validateUserOwnership = createMiddleware(async (c, next) => {
  const jwtPayload = c.get('jwtPayload');

  if (!jwtPayload) {
    return c.json({ message: 'Token is missing' }, 401);
  }

  const userIdFromToken = jwtPayload.sub.id;

  const requestedUserId = c.req.param('id');

  if (userIdFromToken !== requestedUserId) {
    return c.json(
      {
        message: 'You can only access or modify your own data'
      },
      403
    );
  }

  await next();
});
