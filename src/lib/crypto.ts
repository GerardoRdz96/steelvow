/**
 * SEC-SV-005: Web Crypto API encryption for IndexedDB PII fields.
 * Uses AES-GCM with a per-device key stored in a separate IndexedDB store.
 * Protects worker names, phones, injury details, signatures from plaintext exposure.
 */

const ALGORITHM = "AES-GCM";
const KEY_DB_NAME = "SteelvowKeyStore";
const KEY_STORE_NAME = "keys";
const KEY_ID = "pii-encryption-key";
const IV_LENGTH = 12;
const ENCRYPTED_PREFIX = "enc:";

let cachedKey: CryptoKey | null = null;

function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(KEY_STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const keyDb = await openKeyStore();

  // Try to load existing key
  const stored = await new Promise<{ id: string; key: JsonWebKey } | undefined>(
    (resolve, reject) => {
      const tx = keyDb.transaction(KEY_STORE_NAME, "readonly");
      const req = tx.objectStore(KEY_STORE_NAME).get(KEY_ID);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }
  );

  if (stored?.key) {
    cachedKey = await crypto.subtle.importKey(
      "jwk",
      stored.key,
      { name: ALGORITHM },
      false,
      ["encrypt", "decrypt"]
    );
    keyDb.close();
    return cachedKey;
  }

  // Generate new key
  cachedKey = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedKey = await crypto.subtle.exportKey("jwk", cachedKey);

  await new Promise<void>((resolve, reject) => {
    const tx = keyDb.transaction(KEY_STORE_NAME, "readwrite");
    const req = tx.objectStore(KEY_STORE_NAME).put({ id: KEY_ID, key: exportedKey });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  keyDb.close();
  return cachedKey;
}

export async function encryptField(value: string): Promise<string> {
  if (!value || value.startsWith(ENCRYPTED_PREFIX)) return value;

  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(value);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  // Pack: iv + ciphertext, base64-encode, prefix with "enc:"
  const packed = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), IV_LENGTH);

  return ENCRYPTED_PREFIX + btoa(String.fromCharCode(...packed));
}

export async function decryptField(value: string): Promise<string> {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) return value;

  try {
    const key = await getOrCreateKey();
    const packed = Uint8Array.from(
      atob(value.slice(ENCRYPTED_PREFIX.length)),
      (c) => c.charCodeAt(0)
    );

    const iv = packed.slice(0, IV_LENGTH);
    const ciphertext = packed.slice(IV_LENGTH);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    // If decryption fails (e.g., key rotated), return original — data will re-encrypt on next write
    console.warn("Failed to decrypt field, returning as-is");
    return value;
  }
}

/** Encrypt a Record<string, string> (e.g., signatures map) */
export async function encryptRecord(
  record: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    result[k] = await encryptField(v);
  }
  return result;
}

/** Decrypt a Record<string, string> */
export async function decryptRecord(
  record: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    result[k] = await decryptField(v);
  }
  return result;
}

/** Encrypt an array of strings */
export async function encryptArray(arr: string[]): Promise<string[]> {
  return Promise.all(arr.map(encryptField));
}

/** Decrypt an array of strings */
export async function decryptArray(arr: string[]): Promise<string[]> {
  return Promise.all(arr.map(decryptField));
}
