const enc = new TextEncoder(), dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
export const randomHex = (n = 16) => hex(globalThis.crypto.getRandomValues(new Uint8Array(n)));
export const sha256Hex = async (buf) => hex(await subtle().digest("SHA-256", buf));
const baseKey = (pw, usage) => subtle().importKey("raw", enc.encode(pw), "PBKDF2", false, usage);
export async function hashPassword(pw, salt) {
  const bits = await subtle().deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, await baseKey(pw, ["deriveBits"]), 256);
  return hex(bits);
}
export const verifyPassword = async (pw, salt, hash) => (await hashPassword(pw, salt)) === hash;
const aesKey = async (pw, salt, usage) => subtle().deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, await baseKey(pw, ["deriveKey"]), { name: "AES-GCM", length: 256 }, false, usage);
export async function encryptJson(obj, pw) {
  const salt = randomHex(16), iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: "AES-GCM", iv }, await aesKey(pw, salt, ["encrypt"]), enc.encode(JSON.stringify(obj)));
  return { salt, iv: hex(iv), data: hex(ct) };
}
export async function decryptJson(p, pw) {
  const pt = await subtle().decrypt({ name: "AES-GCM", iv: unhex(p.iv) }, await aesKey(pw, p.salt, ["decrypt"]), unhex(p.data));
  return JSON.parse(dec.decode(pt));
}
