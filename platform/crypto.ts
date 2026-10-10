import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/platform/env";

// Field-level encryption for small optional personal fields (child nicknames), AES-256-GCM.
// This is data-at-rest protection, not authentication. Rotating DATA_ENCRYPTION_KEY makes old
// values unreadable (crypto-shred, CR-6). Format: v1.<iv>.<tag>.<ciphertext> (base64url).

function key(secret = env().DATA_ENCRYPTION_KEY): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptField(plain: string, secret?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), ct].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

/** Returns null if the value can't be decrypted (e.g. after a key rotation). */
export function decryptField(value: string, secret?: string): string | null {
  const [version, iv, tag, ct] = value.split(".");
  if (version !== "v1" || !iv || !tag || ct === undefined) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
