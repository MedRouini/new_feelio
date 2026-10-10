import { describe, expect, it } from "vitest";
import { decryptField, encryptField } from "@/platform/crypto";

const secret = "test-secret-test-secret-test-secret-123";

describe("field encryption", () => {
  it("round-trips, including Arabic", () => {
    for (const v of ["Mia", "ليلى", ""]) expect(decryptField(encryptField(v, secret), secret)).toBe(v);
  });
  it("uses a fresh IV each time", () => {
    expect(encryptField("Mia", secret)).not.toBe(encryptField("Mia", secret));
  });
  it("returns null with the wrong key (crypto-shred)", () => {
    expect(decryptField(encryptField("Mia", secret), secret + "x")).toBeNull();
  });
  it("returns null when tampered or malformed", () => {
    const enc = encryptField("Mia", secret);
    const parts = enc.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(decryptField(parts.join("."), secret)).toBeNull();
    expect(decryptField("not-a-value", secret)).toBeNull();
  });
});
