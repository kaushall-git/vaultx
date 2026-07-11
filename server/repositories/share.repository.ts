/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { dbConnection, DBSharedVaultItem, DBSharedLink } from "../database/db.js";

export class ShareRepository {
  // Shared Vault Items (Email Sharing)
  async createSharedVaultItem(
    item: Omit<DBSharedVaultItem, "id" | "createdAt" | "updatedAt">
  ): Promise<DBSharedVaultItem> {
    const db = await dbConnection.load();
    const newItem: DBSharedVaultItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.sharedVaultItems.push(newItem);
    await dbConnection.save(db);
    return newItem;
  }

  async getSharedByMe(ownerId: string): Promise<DBSharedVaultItem[]> {
    const db = await dbConnection.load();
    return db.sharedVaultItems.filter((item) => item.ownerId === ownerId);
  }

  async getSharedWithMe(recipientId: string): Promise<DBSharedVaultItem[]> {
    const db = await dbConnection.load();
    return db.sharedVaultItems.filter((item) => item.recipientId === recipientId);
  }

  async findSharedVaultItemById(id: string): Promise<DBSharedVaultItem | undefined> {
    const db = await dbConnection.load();
    return db.sharedVaultItems.find((item) => item.id === id);
  }

  async updateSharedVaultItem(
    id: string,
    updates: Partial<Omit<DBSharedVaultItem, "id" | "vaultItemId" | "ownerId" | "recipientId" | "createdAt" | "updatedAt">>
  ): Promise<DBSharedVaultItem | null> {
    const db = await dbConnection.load();
    const index = db.sharedVaultItems.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated: DBSharedVaultItem = {
      ...db.sharedVaultItems[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.sharedVaultItems[index] = updated;
    await dbConnection.save(db);
    return updated;
  }

  async deleteSharedVaultItem(id: string): Promise<boolean> {
    const db = await dbConnection.load();
    const initialLength = db.sharedVaultItems.length;
    db.sharedVaultItems = db.sharedVaultItems.filter((item) => item.id !== id);

    if (db.sharedVaultItems.length === initialLength) return false;

    await dbConnection.save(db);
    return true;
  }

  // Shared Links
  async createSharedLink(
    link: Omit<DBSharedLink, "id" | "createdAt">
  ): Promise<DBSharedLink> {
    const db = await dbConnection.load();
    const newLink: DBSharedLink = {
      ...link,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.sharedLinks.push(newLink);
    await dbConnection.save(db);
    return newLink;
  }

  async findSharedLinkByToken(token: string): Promise<DBSharedLink | undefined> {
    const db = await dbConnection.load();
    return db.sharedLinks.find((link) => link.token === token);
  }

  async incrementViewCount(id: string): Promise<void> {
    const db = await dbConnection.load();
    const index = db.sharedLinks.findIndex((link) => link.id === id);
    if (index !== -1) {
      db.sharedLinks[index].viewCount += 1;
      await dbConnection.save(db);
    }
  }

  async deleteSharedLink(id: string): Promise<boolean> {
    const db = await dbConnection.load();
    const initialLength = db.sharedLinks.length;
    db.sharedLinks = db.sharedLinks.filter((link) => link.id !== id);

    if (db.sharedLinks.length === initialLength) return false;

    await dbConnection.save(db);
    return true;
  }

  async getSharedLinksByVaultItem(vaultItemId: string): Promise<DBSharedLink[]> {
    const db = await dbConnection.load();
    return db.sharedLinks.filter((link) => link.vaultItemId === vaultItemId);
  }
}

export const shareRepository = new ShareRepository();
