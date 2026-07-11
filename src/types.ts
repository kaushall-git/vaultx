/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VaultCategory = "login" | "secure_note" | "card" | "identity";

export interface EncryptedVaultItem {
  id: string;
  category: VaultCategory;
  encryptedTitle: string; // Base64 AES-GCM ciphertext + IV
  encryptedPayload: string; // Base64 AES-GCM ciphertext + IV containing JSON string
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedVaultItem {
  id: string;
  category: VaultCategory;
  title: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  // Category-specific details (already decrypted and parsed)
  details: LoginDetails | SecureNoteDetails | CardDetails | IdentityDetails;
  shareInfo?: {
    id: string;
    ownerEmail: string;
    permission: "view" | "copy" | "edit";
    status: "pending" | "accepted";
  };
}

export interface LoginDetails {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

export interface SecureNoteDetails {
  content?: string;
}

export interface CardDetails {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  pin?: string;
  notes?: string;
}

export interface IdentityDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    authSalt: string;
    vaultSalt: string;
    publicKey?: string;
    encryptedPrivateKey?: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ipAddress?: string;
}
