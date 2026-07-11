# VaultX API Specifications

All endpoints are mapped under the `/api/v1` namespace.

---

## 1. Authentication Endpoints

### A. Fetch Cryptographic Salts
Fetches the client-side stretching salts for a user. Helps defeat timing attacks by returning deterministic stable salts for non-existent emails.
*   **Method**: `POST`
*   **Path**: `/api/v1/auth/salts`
*   **Request Body**:
    ```json
    { "email": "user@example.com" }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "exists": true,
      "authSalt": "a82b9...",
      "vaultSalt": "c8d2f..."
    }
    ```

### B. User Registration
Registers a new Zero-Knowledge user.
*   **Method**: `POST`
*   **Path**: `/api/v1/auth/register`
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "authSalt": "a82b9...",
      "vaultSalt": "c8d2f...",
      "authHash": "7f8e..."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbG...",
      "user": {
        "id": "e4f8...",
        "email": "user@example.com",
        "authSalt": "a82b9...",
        "vaultSalt": "c8d2f..."
      }
    }
    ```

### C. Authenticated Login
Generates access and refresh tokens.
*   **Method**: `POST`
*   **Path**: `/api/v1/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "authHash": "7f8e..."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbG...",
      "user": {
        "id": "e4f8...",
        "email": "user@example.com",
        "authSalt": "a82b9...",
        "vaultSalt": "c8d2f..."
      }
    }
    ```

---

## 2. Vault Endpoints
All vault endpoints require an active `Authorization: Bearer <TOKEN>` header.

### A. List Vault Items
*   **Method**: `GET`
*   **Path**: `/api/v1/vault`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "item-uuid",
        "category": "login",
        "encryptedTitle": "...",
        "encryptedPayload": "...",
        "isFavorite": true,
        "createdAt": "2026-07-11T00:30:00.000Z",
        "updatedAt": "2026-07-11T00:30:00.000Z"
      }
    ]
    ```

### B. Create Vault Item
*   **Method**: `POST`
*   **Path**: `/api/v1/vault`
*   **Request Body**:
    ```json
    {
      "category": "login",
      "encryptedTitle": "...",
      "encryptedPayload": "...",
      "isFavorite": false
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": "item-uuid",
      "category": "login",
      "encryptedTitle": "...",
      "encryptedPayload": "...",
      "isFavorite": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```

### C. Update Vault Item
*   **Method**: `PUT`
*   **Path**: `/api/v1/vault/:id`
*   **Request Body**:
    ```json
    {
      "encryptedTitle": "...",
      "encryptedPayload": "...",
      "isFavorite": true
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": "item-uuid",
      "category": "login",
      "encryptedTitle": "...",
      "encryptedPayload": "...",
      "isFavorite": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```

### D. Delete Vault Item
*   **Method**: `DELETE`
*   **Path**: `/api/v1/vault/:id`
*   **Response (200 OK)**:
    ```json
    { "success": true, "message": "Item deleted successfully" }
    ```

---

## 3. Audit Trails

### Get Activity Feed
*   **Method**: `GET`
*   **Path**: `/api/v1/vault/audit-logs`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "log-uuid",
        "action": "VAULT_ITEM_CREATED",
        "details": "Created login item: 'item-uuid'",
        "timestamp": "2026-07-11T00:30:00.000Z",
        "ipAddress": "::1"
      }
    ]
    ```
