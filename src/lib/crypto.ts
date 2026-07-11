/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to convert Hex string to ArrayBuffer
export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Helper to convert string to ArrayBuffer (UTF-8)
export function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

// Helper to convert ArrayBuffer to string (UTF-8)
export function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Helper to generate a cryptographically secure random salt in hex
export function generateRandomSalt(lengthBytes: number = 16): string {
  const array = new Uint8Array(lengthBytes);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Derives the authKey and vaultKey from the master password and respective salts.
 * - authKey: used for logging in / server authentication (hashed)
 * - vaultKey: CryptoKey object used for AES-GCM client-side encryption/decryption
 */
export async function deriveKeys(
  masterPassword: string,
  email: string,
  authSalt: string,
  vaultSalt: string
): Promise<{ authKeyHex: string; vaultKey: CryptoKey }> {
  const passwordBuffer = stringToBuffer(masterPassword);

  // 1. Import raw master password as a key source
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const cleanEmail = email.toLowerCase().trim();

  // 2. Derive Auth Key (100,000 iterations PBKDF2)
  // Incorporate email as part of the salt for extra uniqueness
  const authSaltBuffer = stringToBuffer(`${authSalt}:${cleanEmail}`);
  const authBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: authSaltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256 // 256 bits = 32 bytes
  );
  const authKeyHex = bufferToHex(authBits);

  // 3. Derive Vault Encryption Key (100,000 iterations PBKDF2)
  const vaultSaltBuffer = stringToBuffer(`${vaultSalt}:${cleanEmail}`);
  const vaultKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: vaultSaltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // key is non-extractable for security
    ["encrypt", "decrypt"]
  );

  return { authKeyHex, vaultKey };
}

/**
 * Encrypts cleartext using AES-256-GCM.
 * Returns formatted string: "ivHex:ciphertextHex"
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV is standard for AES-GCM
  const encodedText = stringToBuffer(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  const ivHex = bufferToHex(iv.buffer);
  const ciphertextHex = bufferToHex(ciphertextBuffer);

  return `${ivHex}:${ciphertextHex}`;
}

/**
 * Decrypts a ciphertext formatted as "ivHex:ciphertextHex" using AES-256-GCM.
 */
export async function decryptData(
  encryptedString: string,
  key: CryptoKey
): Promise<string> {
  const parts = encryptedString.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }

  const ivHex = parts[0];
  const ciphertextHex = parts[1];

  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    key,
    ciphertext
  );

  return bufferToString(decryptedBuffer);
}

/**
 * Generates an RSA-OAEP 2048-bit keypair for asymmetric sharing operations.
 */
export async function generateAsymmetricKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a public CryptoKey as a JWK JSON string.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Exports a private CryptoKey as a JWK JSON string.
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Imports a public key from JWK JSON string.
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

/**
 * Imports a private key from JWK JSON string.
 */
export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/**
 * Encrypts a small payload (like a symmetric 256-bit shareKey) using a recipient's public key.
 */
export async function encryptAsymmetric(
  plaintext: string,
  publicKey: CryptoKey
): Promise<string> {
  const data = stringToBuffer(plaintext);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  );
  return bufferToHex(encrypted);
}

/**
 * Decrypts a payload encrypted with the user's public key using their private key.
 */
export async function decryptAsymmetric(
  ciphertextHex: string,
  privateKey: CryptoKey
): Promise<string> {
  const data = hexToBuffer(ciphertextHex);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    data
  );
  return bufferToString(decrypted);
}

/**
 * Imports a 256-bit symmetric key from a hex string for AES-GCM operations.
 */
export async function importSymmetricKey(hexKey: string): Promise<CryptoKey> {
  const buffer = hexToBuffer(hexKey);
  return await window.crypto.subtle.importKey(
    "raw",
    buffer,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}


