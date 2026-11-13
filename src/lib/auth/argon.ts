import bcrypt from "bcryptjs";
import * as argon2 from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using Argon2id with high entropy.
 * Falls back to bcryptjs with 12 rounds if native Argon2 binary is unavailable in the environment.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    return await argon2.hash(plainPassword, ARGON2_OPTIONS);
  } catch {
    return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  }
}

/**
 * Verifies a plaintext password against a stored hash (Argon2id or bcrypt).
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (storedHash.startsWith("$argon2")) {
    try {
      return await argon2.verify(storedHash, plainPassword);
    } catch {
      return false;
    }
  }

  // Handle bcrypt hash ($2a$, $2b$, $2y$)
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(plainPassword, storedHash);
  }

  return false;
}
