import { hash } from 'bcrypt';

export function hashPassword(password: string): Promise<string> {
  // For most systems, use 10 rounds for a good balance between security and performance.
  // For more secure systems, consider 12 rounds.
  // For high-security applications, consider 14 or more, but always test the impact.
  return hash(password, 10);
}
