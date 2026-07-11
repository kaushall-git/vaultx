/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { vaultRepository } from "../repositories/vault.repository.js";
import { auditRepository } from "../repositories/audit.repository.js";

export class VaultService {
  async getItems(userId: string) {
    return await vaultRepository.getVaultItems(userId);
  }

  async createItem(userId: string, itemData: {
    category: "login" | "secure_note" | "card" | "identity";
    encryptedTitle: string;
    encryptedPayload: string;
    isFavorite?: boolean;
  }, ip?: string) {
    const newItem = await vaultRepository.createVaultItem(userId, {
      category: itemData.category,
      encryptedTitle: itemData.encryptedTitle,
      encryptedPayload: itemData.encryptedPayload,
      isFavorite: !!itemData.isFavorite,
    });

    await auditRepository.createAuditLog(
      userId,
      "VAULT_ITEM_CREATED",
      `Created ${itemData.category} item: '${newItem.id}'`,
      ip
    );

    return newItem;
  }

  async updateItem(id: string, userId: string, updates: {
    encryptedTitle?: string;
    encryptedPayload?: string;
    isFavorite?: boolean;
  }, ip?: string) {
    const item = await vaultRepository.findVaultItemById(id, userId);
    if (!item) {
      throw { status: 404, message: "Vault item not found" };
    }

    const updatedItem = await vaultRepository.updateVaultItem(id, userId, {
      encryptedTitle: updates.encryptedTitle !== undefined ? updates.encryptedTitle : item.encryptedTitle,
      encryptedPayload: updates.encryptedPayload !== undefined ? updates.encryptedPayload : item.encryptedPayload,
      isFavorite: updates.isFavorite !== undefined ? !!updates.isFavorite : item.isFavorite,
    });

    await auditRepository.createAuditLog(
      userId,
      "VAULT_ITEM_UPDATED",
      `Updated ${item.category} item: '${id}'`,
      ip
    );

    return updatedItem;
  }

  async deleteItem(id: string, userId: string, ip?: string) {
    const item = await vaultRepository.findVaultItemById(id, userId);
    if (!item) {
      throw { status: 404, message: "Vault item not found" };
    }

    await vaultRepository.deleteVaultItem(id, userId);

    await auditRepository.createAuditLog(
      userId,
      "VAULT_ITEM_DELETED",
      `Deleted ${item.category} item: '${id}'`,
      ip
    );

    return { success: true };
  }

  async getAuditLogs(userId: string) {
    return await auditRepository.getAuditLogs(userId);
  }
}

export const vaultService = new VaultService();
