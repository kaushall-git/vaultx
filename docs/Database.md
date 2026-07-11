# VaultX Database Schema

VaultX utilizes a structured, fully relational database model optimized for indexing, quick access, and secure referencing.

---

## 1. Schema Relations (ERD Model)

```
  ┌──────────────┐
  │     User     │◄───────┐
  └──────┬──────┬┘        │
         │      │         │
    1:N  │      │ 1:N     │ 1:1
         │      │         │
  ┌──────▼───┐ ┌▼─────────┴┐ ┌▼─────────────┐
  │ VaultItem│ │  AuditLog │ │ UserSettings │
  └──────────┘ └───────────┘ └──────────────┘
```

---

## 2. Model Definitions

### `User`
Main account representation. Holds structural configuration salts needed for client key-stretching.
*   `id` (String, Primary Key, UUID)
*   `email` (String, Unique Index)
*   `authHash` (String) - Double server-side hash of the master password derivative.
*   `authSalt` (String) - Hex salt for client-side stretching (PBKDF2).
*   `vaultSalt` (String) - Hex salt for client-side data key derivation.
*   `createdAt` / `updatedAt` (DateTime)

### `VaultItem`
Encrypted records representing user credentials.
*   `id` (String, Primary Key, UUID)
*   `userId` (String, Foreign Key -> User, Indexed)
*   `category` (Enum: `LOGIN`, `SECURE_NOTE`, `CARD`, `IDENTITY`, Indexed)
*   `encryptedTitle` (String) - AES-256-GCM client-side encrypted text.
*   `encryptedPayload` (String) - AES-256-GCM client-side encrypted JSON.
*   `isFavorite` (Boolean, Default: false)

### `AuditLog`
Audit trails keeping track of secure actions on user accounts.
*   `id` (String, Primary Key, UUID)
*   `userId` (String, Foreign Key -> User, Indexed)
*   `action` (String) - Action identifier (e.g., `VAULT_ITEM_CREATED`).
*   `details` (String) - Context text.
*   `ipAddress` (String, Optional)
*   `timestamp` (DateTime, Indexed)

---

## 3. Database Migration Procedures

To migrate the schema to a live production database:

1.  Specify your live PostgreSQL connection string in `.env`:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/vaultx_prod"
    ```
2.  Deploy migrations using Prisma:
    ```bash
    npx prisma migrate dev --name init
    ```
3.  Generate the Prisma Client:
    ```bash
    npx prisma generate
    ```
