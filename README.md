# VaultX — Zero-Knowledge Password & Secret Manager

VaultX is a production-grade, offline-first, zero-knowledge password and credentials manager. It is designed to securely store and organize login credentials, confidential secure notes, payment card coordinates, and identity data. 

**Protected by You. Decrypted by You.**

---

## 🔒 Security Model & Cryptographic Pipeline

VaultX operates on a strict **Zero-Knowledge Architecture**. The server never learns, transmits, or stores the user's Master Password or decrypted vaults. All cryptographic operations occur natively inside the client's browser sandbox using the audited **W3C Web Crypto API**.

### 1. Ephemeral Master Key Derivation
When a user signs up or logs in, the Master Password is stretched locally using **PBKDF2** (Password-Based Key Derivation Function 2) with **100,000 iterations of SHA-256** and a unique cryptographic salt. 

VaultX bifurcates the stretched output into two distinct keys:
*   **Authentication Key (`authKey`)**: Derived by combining the master password with an `authSalt` and the user's email address. This key is encoded as hex and sent to the server.
*   **Vault Master Key (`vaultKey`)**: Derived by combining the master password with a separate `vaultSalt` and the user's email address. **This key is stored strictly in client memory (RAM) and is never sent over any network.**

### 2. Double Server-Side Hashing
When the server receives the client's derived `authKey`, it does not store it directly. It hashes the `authKey` once more using **HMAC-SHA256** with the user's `authSalt`.
*   *Why?* If the server database is ever compromised, the attacker only obtains the double-hashed record. They cannot authenticate directly because they would need the client-derived `authKey`, protecting the user against direct server impersonation.

### 3. Client-Side AES-256-GCM Encryption
Before any secret (usernames, passwords, addresses, card CVVs) is uploaded, it is compiled as a JSON string and encrypted on the client side using **AES-256-GCM** (Galois/Counter Mode).
*   For every encrypted item, a fresh, cryptographically secure **12-byte Initialization Vector (IV)** is generated.
*   The output is formatted as `ivHex:ciphertextHex` and sent to the server.
*   GCM provides both confidentiality and **integrity validation** (authenticated encryption), ensuring ciphertext cannot be modified in transit without detection.

---

## 🚀 Key Features

*   **Zero-Knowledge Auth**: User credentials and vaults are completely safe, even in the event of a full server database compromise.
*   **Four Asset Categories**: Dedicated layouts for Logins, Secure Notes, Payment Cards, and Identities.
*   **Security Health Auditor**: Client-side scanning engine analyzing password strings for weakness or duplication. Calculates a dynamic visual **Security Health Index**.
*   **Cryptographic Password Generator**: Configurable, secure entropy generator (custom lengths, symbols, numbers, upper/lowercase alphabets) built using window.crypto values.
*   **Tamper-Proof Audit Trail**: An un-editable rolling log of all registration, session logging, and credential changes.
*   **Safe Migration (Encrypted Export/Import)**: Support for exporting fully encrypted raw JSON backups (safely storable on any drive) or decrypted plaintext records, with smart importing workflows.
*   **Session Lock**: Ephemeral session memory is purged on lock, requiring the master password to re-initialize derived CryptoKeys.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Zustand (State Engine).
*   **Backend**: Node.js, Express, tsx, esbuild, JWT (jsonwebtoken).
*   **Security/Database**: Web Crypto API (SubtleCrypto), atomic write file-based relational-style JSON database.

---

## 📁 Database Schema Reference

Our backend database is located in the root as `vaultx_db.json`. It maps three normalized structures:

### 1. Users Collection
```typescript
interface DBUser {
  id: string;        // Unique UUID
  email: string;     // Normalized and lowercased email
  authHash: string;  // Server double-hashed authKey
  authSalt: string;  // Salt for client Auth key derivation
  vaultSalt: string; // Salt for client Vault key derivation
  createdAt: string; // ISO Timestamp
}
```

### 2. Vault Items Collection
```typescript
interface DBVaultItem {
  id: string;
  userId: string;
  category: "login" | "secure_note" | "card" | "identity";
  encryptedTitle: string;   // AES-GCM encrypted title
  encryptedPayload: string; // AES-GCM encrypted JSON details string
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Audit Logs Collection
```typescript
interface DBAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
```

---

## 📡 API Endpoints

All endpoints are versioned under `/api/v1/*` and communicate using JSON.

### Authentication Endpoints
*   `POST /api/v1/auth/salts`: Fetches salts. *Mitigates user-enumeration* by generating identical timing-safe dummy salts for non-existent emails.
*   `POST /api/v1/auth/register`: Signs up a user, hashes authHash, registers user, and returns JWT.
*   `POST /api/v1/auth/login`: Verifies user credentials, logs audit, and signs JWT.
*   `GET /api/v1/auth/me` [Auth Required]: Validates JWT and returns active session data.

### Vault Endpoints
*   `GET /api/v1/vault` [Auth Required]: Downloads encrypted vault items.
*   `POST /api/v1/vault` [Auth Required]: Uploads a newly encrypted item.
*   `PUT /api/v1/vault/:id` [Auth Required]: Overwrites an item's encrypted fields.
*   `DELETE /api/v1/vault/:id` [Auth Required]: Removes an item and logs audit.

### Auditor & Timeline Endpoints
*   `GET /api/v1/audit-logs` [Auth Required]: Loads user-specific chronological ledger records.

---

## 🏃 Development and Build Instructions

### Installation
Ensure dependencies are fully installed:
```bash
npm install
```

### Local Development
To run the Express + Vite full-stack dev server:
```bash
npm run dev
```
The server will boot on port `3000`. Vite assets are loaded on demand.

### Production Bundling
Compiles React frontend assets to `/dist` and bundles our Express server as a standalone file `/dist/server.cjs` using `esbuild`:
```bash
npm run build
```

### Start Production Server
Launches the bundled standalone application:
```bash
npm run start
```
