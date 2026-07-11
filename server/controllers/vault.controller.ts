/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createVaultItemSchema, updateVaultItemSchema } from "../validators/vault.validator.js";
import { vaultService } from "../services/vault.service.js";

export class VaultController {
  async getItems(req: any, res: any) {
    try {
      const items = await vaultService.getItems(req.user.userId);
      return res.json(items);
    } catch (error: any) {
      console.error("Get items controller error:", error);
      return res.status(500).json({ error: "Failed to fetch vault items" });
    }
  }

  async createItem(req: any, res: any) {
    try {
      const parsed = createVaultItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const newItem = await vaultService.createItem(req.user.userId, parsed.data, req.ip);
      return res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Create item controller error:", error);
      return res.status(500).json({ error: "Failed to create vault item" });
    }
  }

  async updateItem(req: any, res: any) {
    try {
      const { id } = req.params;
      const parsed = updateVaultItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const updatedItem = await vaultService.updateItem(id, req.user.userId, parsed.data, req.ip);
      return res.json(updatedItem);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to update vault item";
      if (status !== 500) {
        return res.status(status).json({ error: msg });
      }
      console.error("Update item controller error:", error);
      return res.status(500).json({ error: msg });
    }
  }

  async deleteItem(req: any, res: any) {
    try {
      const { id } = req.params;
      const result = await vaultService.deleteItem(id, req.user.userId, req.ip);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to delete vault item";
      if (status !== 500) {
        return res.status(status).json({ error: msg });
      }
      console.error("Delete item controller error:", error);
      return res.status(500).json({ error: msg });
    }
  }

  async getAuditLogs(req: any, res: any) {
    try {
      const logs = await vaultService.getAuditLogs(req.user.userId);
      return res.json(logs);
    } catch (error: any) {
      console.error("Get audit logs controller error:", error);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
}

export const vaultController = new VaultController();
