import { createHash, randomBytes } from 'node:crypto';

export function generateOTPCode() {
  const buffer = randomBytes(32);
  const otp = (Number.parseInt(createHash('sha256').update(buffer).digest('hex'), 16) % 1000000)
    .toString()
    .slice(0, 6);

  return otp;
}
