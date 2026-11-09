import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

// เก็บในรูป "salt:hash" (hex)
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const test = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), test);
}
