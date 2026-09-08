/**
 * Generates a random UUID (v4).
 *
 * Prefers the native crypto.randomUUID() where available, falling back to a
 * manual RFC 4122 v4 construction from crypto.getRandomValues().
 *
 * Why the fallback: crypto.randomUUID() is only exposed in "secure contexts"
 * (HTTPS, localhost, or file://). When the app is served over a plain-HTTP
 * LAN address (e.g. http://192.168.2.85:5173) the method is undefined, which
 * crashes at runtime. crypto.getRandomValues() is available everywhere.
 */
export function generateUUID(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // RFC 4122: version 4 (random) and variant 10 (RFC 4122).
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}