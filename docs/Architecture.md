# VaultX Architecture

VaultX is designed with a **Zero-Knowledge client-side encryption paradigm**. The server has no visibility into raw credentials, passwords, notes, or cards. Decryption keys are derived exclusively in the client's memory and are never transmitted over the network.

---

## 1. System Layers

```
┌────────────────────────────────────────────────────────┐
│                      Client (SPA)                      │
│   React / Zustand State / Tailwind UI / Lucide Icons   │
└───────────────────────────┬────────────────────────────┘
                            │
              HTTPS Rest / JSON Payloads
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
└───────────────────────────┬────────────────────────────┘
                            │
               Service Layer / Business Logic
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Repositories Layer                    │
└───────────────────────────┬────────────────────────────┘
                            │
     Prisma ORM (Production) / Atomic Cache JSON Engine
                            │
┌───────────────────────────▼────────────────────────────┐
│                       Database                         │
│             PostgreSQL / Local Persistent DB           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Structure (Feature-Based)

The frontend uses **Feature-Based Domain Architecture** for scalability:

*   **`src/features/auth/`**: Custom PBKDF2 Master key stretching, registration, local lock screen, auto-lock timeouts, and unlock UI panels.
*   **`src/features/vault/`**: Lists, category filtering, search query handling, and detail rendering of encrypted credentials.
*   **`src/features/generator/`**: Secure client-side random and pass-phrase password builders.
*   **`src/features/security/`**: Health calculations, weak password detection, and reused key exposure auditing.
*   **`src/features/settings/`**: Decrypted backups, Chrome CSV imports, and settings preferences.
*   **`src/features/audit/`**: Display of server-side actions, login success/failure feeds, and security logs.
*   **`src/shared/components/`**: Cross-functional UI components such as layout wrappers, menus, and the sidebar.

---

## 3. Backend Structure (Separation of Concerns)

No business logic is hosted in routing files. The Express engine is decoupled as follows:

*   **`server/config/`**: Strong runtime configurations validated with Zod.
*   **`server/database/`**: Thread-safe atomic persistence connectors.
*   **`server/middleware/`**: JWT Access/Refresh Token validators and manually parsed cookie extractors.
*   **`server/validators/`**: Input validation schemas (Zod).
*   **`server/repositories/`**: Domain specific DB read/write actions (User, Vault, Audit).
*   **`server/services/`**: Coordination of security models, server-side hashing, and logging.
*   **`server/controllers/`**: Marshalling of JSON payloads and routing responses.
*   **`server/routes/`**: Clean mapping of URL endpoints to controller handlers.
