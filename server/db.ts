/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository } from "./repositories/user.repository.js";
import { vaultRepository } from "./repositories/vault.repository.js";
import { auditRepository } from "./repositories/audit.repository.js";

class LegacyDatabaseAdapter {
  async findUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async findUserById(id: string) {
    return userRepository.findById(id);
  }

  async createUser(user: any) {
    return userRepository.create(user);
  }

  async getVaultItems(userId: string) {
    return vaultRepository.getVaultItems(userId);
  }

  async findVaultItemById(id: string, userId: string) {
    return vaultRepository.findVaultItemById(id, userId);
  }

  async createVaultItem(userId: string, item: any) {
    return vaultRepository.createVaultItem(userId, item);
  }

  async updateVaultItem(id: string, userId: string, updates: any) {
    return vaultRepository.updateVaultItem(id, userId, updates);
  }

  async deleteVaultItem(id: string, userId: string) {
    return vaultRepository.deleteVaultItem(id, userId);
  }

  async getAuditLogs(userId: string) {
    return auditRepository.getAuditLogs(userId);
  }

  async createAuditLog(userId: string, action: string, details: string, ipAddress?: string) {
    return auditRepository.createAuditLog(userId, action, details, ipAddress);
  }
}

export const db = new LegacyDatabaseAdapter();
