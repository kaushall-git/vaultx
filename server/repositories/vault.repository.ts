/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { dbConnection, DBVaultItem } from "../database/db.js";

export class VaultRepository {
  async getVaultItems(userId: string): Promise<DBVaultItem[]> {
    const db = await dbConnection.load();
    return db.vaultItems.filter((item) => item.userId === userId);
  }

  async findVaultItemById(id: string, userId: string): Promise<DBVaultItem | undefined> {
    const db = await dbConnection.load();
    return db.vaultItems.find((item) => item.id === id && item.userId === userId);
  }

  async createVaultItem(
    userId: string,
    item: Omit<DBVaultItem, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<DBVaultItem> {
    const db = await dbConnection.load();
    const newItem: DBVaultItem = {
      ...item,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.vaultItems.push(newItem);
    await dbConnection.save(db);
    return newItem;
  }

  async updateVaultItem(
    id: string,
    userId: string,
    updates: Partial<Omit<DBVaultItem, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<DBVaultItem | null> {
    const db = await dbConnection.load();
    const itemIndex = db.vaultItems.findIndex((item) => item.id === id && item.userId === userId);

    if (itemIndex === -1) return null;

    const updatedItem: DBVaultItem = {
      ...db.vaultItems[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.vaultItems[itemIndex] = updatedItem;
    await dbConnection.save(db);
    return updatedItem;
  }

  async deleteVaultItem(id: string, userId: string): Promise<boolean> {
    const db = await dbConnection.load();
    const initialLength = db.vaultItems.length;
    db.vaultItems = db.vaultItems.filter((item) => !(item.id === id && item.userId === userId));

    if (db.vaultItems.length === initialLength) return false;

    await dbConnection.save(db);
    return true;
  }
}

export const vaultRepository = new VaultRepository();
