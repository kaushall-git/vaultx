/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "vaultx_db.json");

export interface DBUser {
  id: string;
  email: string;
  authHash: string;
  authSalt: string;
  vaultSalt: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  createdAt: string;
}

export interface DBVaultItem {
  id: string;
  userId: string;
  category: "login" | "secure_note" | "card" | "identity";
  encryptedTitle: string;
  encryptedPayload: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBSharedVaultItem {
  id: string;
  vaultItemId: string;
  ownerId: string;
  recipientId: string;
  ownerEmail: string;
  recipientEmail: string;
  encryptedTitle: string;
  encryptedPayload: string;
  encryptedShareKey: string; // shareKey encrypted with recipient's public key
  permission: "view" | "copy" | "edit";
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface DBSharedLink {
  id: string;
  token: string;
  vaultItemId: string;
  encryptedTitle: string;
  encryptedPayload: string;
  expiresAt: string;
  viewLimit: number;
  viewCount: number;
  passwordProtected: boolean;
  passwordHash?: string; // Optional master-password style check if requested
  createdAt: string;
}

export interface DBAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface DatabaseSchema {
  users: DBUser[];
  vaultItems: DBVaultItem[];
  sharedVaultItems: DBSharedVaultItem[];
  sharedLinks: DBSharedLink[];
  auditLogs: DBAuditLog[];
}

const INITIAL_DB: DatabaseSchema = {
  users: [],
  vaultItems: [],
  sharedVaultItems: [],
  sharedLinks: [],
  auditLogs: [],
};

class DatabaseConnection {
  private cache: DatabaseSchema | null = null;
  private writePromise: Promise<void> = Promise.resolve();

  async load(): Promise<DatabaseSchema> {
    if (this.cache) return this.cache;

    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      const parsed = JSON.parse(data);
      let modified = false;

      const cache: DatabaseSchema = { ...INITIAL_DB };
      for (const key of Object.keys(INITIAL_DB) as Array<keyof DatabaseSchema>) {
        if (parsed && parsed[key] !== undefined) {
          cache[key] = parsed[key] as any;
        } else {
          modified = true;
        }
      }
      this.cache = cache;

      if (modified) {
        await this.save(this.cache);
      }
      return this.cache;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        await this.save(INITIAL_DB);
        this.cache = { ...INITIAL_DB };
        return this.cache;
      }
      console.error("Failed to read database file, resetting cache", error);
      this.cache = { ...INITIAL_DB };
      return this.cache;
    }
  }

  async save(data: DatabaseSchema): Promise<void> {
    const tempPath = `${DB_PATH}.tmp`;
    const dataStr = JSON.stringify(data, null, 2);

    this.writePromise = this.writePromise.then(async () => {
      try {
        await fs.writeFile(tempPath, dataStr, "utf-8");
        await fs.rename(tempPath, DB_PATH);
      } catch (err) {
        console.error("Database write error:", err);
        try {
          await fs.unlink(tempPath);
        } catch {}
        throw err;
      }
    });

    await this.writePromise;
  }
}

export const dbConnection = new DatabaseConnection();
