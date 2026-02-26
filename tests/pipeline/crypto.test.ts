import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("crypto", () => {
  it("encrypt → decrypt retorna o texto original", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const original = "ya29.a0AfH6SMBx_fake_google_access_token_1234567890";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("texto encriptado tem formato iv:encrypted:tag", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("test-token");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[a-f0-9]{32}$/);
    expect(parts[2]).toMatch(/^[a-f0-9]{32}$/);
  });

  it("encriptações diferentes do mesmo texto produzem resultados diferentes (IV aleatório)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const a = encrypt("same-token");
    const b = encrypt("same-token");
    expect(a).not.toBe(b);
  });

  it("decrypt com payload inválido lança erro", async () => {
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt("invalid-payload")).toThrow(
      "Invalid encrypted payload format"
    );
  });

  it("decrypt com chave errada falha", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("secret-token");

    process.env.ENCRYPTION_KEY =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt(encrypted)).toThrow();

    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });
});
