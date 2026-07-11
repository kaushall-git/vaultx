# VaultX Cryptographic Specifications

VaultX guarantees ultimate privacy and mathematical security for stored passwords and secrets through a **Zero-Knowledge Architecture**.

---

## 1. Mathematical Pipeline

```
  User Master Password + Email
              │
              ▼
    [ PBKDF2 Stretching ] (100,000 Iterations, SHA-256)
              │
              ├─────────────────────────────────────┐
              ▼                                     ▼
        AuthKey (Client)                     Encryption Key (Client)
              │                                     │
              ▼                                     ▼
      [ SHA-256 Hash ]                       [ AES-256-GCM ]
              │                                     │
              ▼                                     ▼
       AuthHash (Wire)                       Encrypted Data (Wire)
              │                                     │
              ▼                                     ▼
[ Server HMAC-SHA256 (authSalt) ]             Sent to Database
              │
              ▼
     ServerAuthHash (Stored)
```

---

## 2. Cryptographic Steps

### A. Client-Side Key Stretching
We use **PBKDF2-HMAC-SHA256** with 100,000 stretching iterations (or client-side equivalents) to derive two independent 256-bit keys using distinct salts retrieved from the server:
1.  **`AuthKey`**: Derived using `authSalt` + user's email.
2.  **`EncryptionKey`**: Derived using `vaultSalt` + user's email.

### B. Transit Hashing
To prevent passing the master key over the network, the client hashes the derived `AuthKey` with **SHA-256** before dispatching:
$$\text{AuthHash} = \text{SHA-256}(\text{AuthKey})$$

### C. Server-Side Double Hashing
When the `AuthHash` is received by the server, it is hashed once more using a secret cryptographic salt unique to that user account:
$$\text{ServerAuthHash} = \text{HMAC-SHA-256}(\text{AuthHash}, \text{authSalt})$$
This double-hash is stored in the database, protecting the user from database credential theft or brute-force rainbow table attacks on raw transit hashes.

### D. Zero-Knowledge Encryption
All secrets, titles, cards, and usernames are encrypted client-side using **AES-256-GCM** authenticated symmetric encryption.
*   The raw decryption key remains completely in the user's browser memory.
*   The server only stores ciphertext alongside cryptographically random initialization vectors (IVs) and authentication tags.
*   If the database is leaked, raw credentials remain mathematically unreadable.
