import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/** `promisify` loses scrypt's options overload, so it is wrapped by hand. */
function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Password hashing with scrypt from Node's own crypto module.
 *
 * scrypt is deliberately slow and memory-hard, which is what makes a stolen
 * database expensive to attack. Using the built-in avoids a native dependency
 * that shared Node hosting often cannot compile.
 *
 * Stored form: `scrypt$N$r$p$salt$hash`, all hex. Keeping the parameters in
 * the string means hashes written today still verify after the cost is raised
 * for new ones.
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelism
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);

  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
  });

  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

/**
 * Check a password against a stored hash. Returns false rather than throwing
 * for a malformed or unknown hash, so a corrupt row cannot become a 500 on the
 * sign-in path.
 */
export async function verifyPassword(
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }

  try {
    const derived = await scryptAsync(
      password.normalize("NFKC"),
      Buffer.from(saltHex, "hex"),
      expected.length,
      // Node refuses parameters above its default memory ceiling; raise it to
      // match whatever cost this hash was written with.
      { N: n, r, p, maxmem: 256 * n * r }
    );

    // Constant-time: a length check first, since timingSafeEqual throws on a
    // mismatch and that throw would itself leak the length.
    if (derived.length !== expected.length) return false;

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
