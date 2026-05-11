/**
 * Set by the require-auth middleware after a Clerk session token is verified
 * and the caller's default account is resolved.
 *
 * `clerkId` comes from the Clerk JWT `sub` claim; `userId` and `accountId`
 * come from our DB lookup keyed on `clerkId`.
 */
export type AuthContext = {
  clerkId: string;
  userId: string;
  accountId: string;
  email: string;
};

export type AppVariables = {
  auth: AuthContext;
  requestId: string;
};
