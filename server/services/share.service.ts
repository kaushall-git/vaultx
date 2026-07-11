/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { shareRepository } from "../repositories/share.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { vaultRepository } from "../repositories/vault.repository.js";
import { auditRepository } from "../repositories/audit.repository.js";

export class ShareService {
  async shareByEmail(
    ownerId: string,
    data: {
      vaultItemId: string;
      recipientEmail: string;
      permission: "view" | "copy" | "edit";
      encryptedTitle: string;
      encryptedPayload: string;
      encryptedShareKey: string;
      expiresAt?: string | null;
    },
    ip?: string
  ) {
    // 1. Verify recipient exists
    const recipient = await userRepository.findByEmail(data.recipientEmail);
    if (!recipient) {
      throw { status: 404, message: "Recipient user account not found" };
    }

    if (recipient.id === ownerId) {
      throw { status: 400, message: "You cannot share a password with yourself" };
    }

    if (!recipient.publicKey) {
      throw {
        status: 400,
        message: "Recipient has not initialized secure sharing keys yet. Ask them to log in once first.",
      };
    }

    // 2. Verify vault item ownership
    const vaultItem = await vaultRepository.findVaultItemById(data.vaultItemId, ownerId);
    if (!vaultItem) {
      throw { status: 403, message: "Access denied or vault item not found" };
    }

    const owner = await userRepository.findById(ownerId);
    if (!owner) {
      throw { status: 404, message: "Owner user not found" };
    }

    // 3. Create the SharedVaultItem
    const sharedItem = await shareRepository.createSharedVaultItem({
      vaultItemId: data.vaultItemId,
      ownerId,
      recipientId: recipient.id,
      ownerEmail: owner.email,
      recipientEmail: recipient.email,
      encryptedTitle: data.encryptedTitle,
      encryptedPayload: data.encryptedPayload,
      encryptedShareKey: data.encryptedShareKey,
      permission: data.permission,
      status: "pending",
      expiresAt: data.expiresAt || null,
    });

    // 4. Create Audit Log
    await auditRepository.createAuditLog(
      ownerId,
      "SHARE_CREATED",
      `Shared password entry '${data.vaultItemId}' with ${data.recipientEmail} (${data.permission})`,
      ip
    );

    await auditRepository.createAuditLog(
      recipient.id,
      "SHARE_RECEIVED",
      `Received pending share invite from ${owner.email} for password entry`,
      ip
    );

    return sharedItem;
  }

  async generateShareLink(
    ownerId: string,
    data: {
      vaultItemId: string;
      encryptedTitle: string;
      encryptedPayload: string;
      expiresAt: string;
      viewLimit: number;
      passwordProtected: boolean;
      passwordHash?: string;
    },
    ip?: string
  ) {
    // 1. Verify item ownership
    const vaultItem = await vaultRepository.findVaultItemById(data.vaultItemId, ownerId);
    if (!vaultItem) {
      throw { status: 403, message: "Access denied or vault item not found" };
    }

    // 2. Generate a secure random token
    const token = crypto.randomBytes(24).toString("hex");

    // 3. Create the SharedLink
    const sharedLink = await shareRepository.createSharedLink({
      token,
      vaultItemId: data.vaultItemId,
      encryptedTitle: data.encryptedTitle,
      encryptedPayload: data.encryptedPayload,
      expiresAt: data.expiresAt,
      viewLimit: data.viewLimit,
      viewCount: 0,
      passwordProtected: data.passwordProtected,
      passwordHash: data.passwordHash,
    });

    // 4. Create Audit Log
    await auditRepository.createAuditLog(
      ownerId,
      "SHARE_LINK_GENERATED",
      `Generated secure shareable link for password entry '${data.vaultItemId}'`,
      ip
    );

    return sharedLink;
  }

  async getShareLinkByToken(token: string, ip?: string) {
    const link = await shareRepository.findSharedLinkByToken(token);
    if (!link) {
      throw { status: 404, message: "Share link not found or already deleted" };
    }

    // Verify expiration
    if (new Date(link.expiresAt) < new Date()) {
      await shareRepository.deleteSharedLink(link.id);
      throw { status: 410, message: "This share link has expired" };
    }

    // Verify view count limit
    if (link.viewLimit > 0 && link.viewCount >= link.viewLimit) {
      await shareRepository.deleteSharedLink(link.id);
      throw { status: 410, message: "This share link has reached its maximum view limit" };
    }

    // Increment view count
    await shareRepository.incrementViewCount(link.id);

    // If it was a one-time link, delete it or prepare for deletion upon retrieval
    if (link.viewLimit > 0 && link.viewCount + 1 >= link.viewLimit) {
      await shareRepository.deleteSharedLink(link.id);
    }

    return {
      id: link.id,
      encryptedTitle: link.encryptedTitle,
      encryptedPayload: link.encryptedPayload,
      expiresAt: link.expiresAt,
      passwordProtected: link.passwordProtected,
      viewCount: link.viewCount + 1,
      viewLimit: link.viewLimit,
    };
  }

  async acceptShare(shareId: string, recipientId: string, ip?: string) {
    const sharedItem = await shareRepository.findSharedVaultItemById(shareId);
    if (!sharedItem) {
      throw { status: 404, message: "Shared invitation not found" };
    }

    if (sharedItem.recipientId !== recipientId) {
      throw { status: 403, message: "You are not authorized to accept this share" };
    }

    if (sharedItem.status !== "pending") {
      throw { status: 400, message: `This share invitation is already ${sharedItem.status}` };
    }

    // Check expiration
    if (sharedItem.expiresAt && new Date(sharedItem.expiresAt) < new Date()) {
      await shareRepository.updateSharedVaultItem(shareId, { status: "revoked" });
      throw { status: 410, message: "This shared invitation has expired" };
    }

    // Update status to accepted
    const updated = await shareRepository.updateSharedVaultItem(shareId, { status: "accepted" });

    // Logs
    await auditRepository.createAuditLog(
      recipientId,
      "SHARE_ACCEPTED",
      `Accepted shared password entry from ${sharedItem.ownerEmail}`,
      ip
    );

    await auditRepository.createAuditLog(
      sharedItem.ownerId,
      "SHARE_ACCEPTED_BY_RECIPIENT",
      `Recipient ${sharedItem.recipientEmail} accepted your shared password entry`,
      ip
    );

    return updated;
  }

  async updateShareDetails(
    shareId: string,
    userId: string,
    encryptedTitle: string,
    encryptedPayload: string,
    ip?: string
  ) {
    const sharedItem = await shareRepository.findSharedVaultItemById(shareId);
    if (!sharedItem) {
      throw { status: 404, message: "Shared item not found" };
    }

    if (sharedItem.ownerId !== userId) {
      if (sharedItem.recipientId !== userId || sharedItem.permission !== "edit") {
        throw { status: 403, message: "You do not have permission to edit this shared item" };
      }
    }

    const updated = await shareRepository.updateSharedVaultItem(shareId, {
      encryptedTitle,
      encryptedPayload,
    });

    await auditRepository.createAuditLog(
      userId,
      "SHARE_UPDATED",
      `Updated shared password entry '${shareId}' details`,
      ip
    );

    return updated;
  }

  async revokeShare(shareId: string, userId: string, ip?: string) {
    const sharedItem = await shareRepository.findSharedVaultItemById(shareId);
    if (sharedItem) {
      // Must be owner or recipient (to leave)
      if (sharedItem.ownerId !== userId && sharedItem.recipientId !== userId) {
        throw { status: 403, message: "Access denied" };
      }

      await shareRepository.deleteSharedVaultItem(shareId);

      const targetLogUser = sharedItem.ownerId === userId ? sharedItem.recipientId : sharedItem.ownerId;
      await auditRepository.createAuditLog(
        userId,
        "SHARE_REVOKED",
        `Revoked secure shared access for item with ${sharedItem.recipientEmail}`,
        ip
      );

      await auditRepository.createAuditLog(
        targetLogUser,
        "SHARE_REVOKED_BY_PEER",
        `Access to shared item has been revoked by ${sharedItem.ownerEmail}`,
        ip
      );

      return { success: true };
    }

    // Also check links
    const link = await shareRepository.findSharedLinkByToken(shareId); // Can pass ID or token for link revoke
    if (link) {
      // Verify owner owns the underlying vault item
      const item = await vaultRepository.findVaultItemById(link.vaultItemId, userId);
      if (!item) {
        throw { status: 403, message: "Access denied" };
      }

      await shareRepository.deleteSharedLink(link.id);

      await auditRepository.createAuditLog(
        userId,
        "SHARE_LINK_REVOKED",
        `Revoked secure shared link`,
        ip
      );

      return { success: true };
    }

    // If still not found, check if passed standard UUID instead of token
    const db = await shareRepository.getSharedLinksByVaultItem(shareId);
    if (db.length > 0) {
      // Delete the links
      for (const l of db) {
        await shareRepository.deleteSharedLink(l.id);
      }
      return { success: true };
    }

    throw { status: 404, message: "Shared resource not found" };
  }

  async getMyShared(userId: string) {
    // Shared by me
    const sharedByMe = await shareRepository.getSharedByMe(userId);
    
    // Also fetch all active shareable links for the user's items
    const items = await vaultRepository.getVaultItems(userId);
    const itemIds = items.map((i) => i.id);
    
    const allLinks = await Promise.all(
      itemIds.map((itemId) => shareRepository.getSharedLinksByVaultItem(itemId))
    );
    const sharedLinks = allLinks.flat();

    return {
      sharedByMe,
      sharedLinks,
    };
  }

  async getReceivedShares(userId: string) {
    return await shareRepository.getSharedWithMe(userId);
  }
}

export const shareService = new ShareService();
