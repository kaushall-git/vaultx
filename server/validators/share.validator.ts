/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const emailShareSchema = z.object({
  vaultItemId: z.string().uuid("Invalid vault item ID"),
  recipientEmail: z.string().email("Invalid recipient email"),
  permission: z.enum(["view", "copy", "edit"]),
  encryptedTitle: z.string().min(1, "Encrypted title is required"),
  encryptedPayload: z.string().min(1, "Encrypted payload is required"),
  encryptedShareKey: z.string().min(1, "Encrypted share key is required"),
  expiresAt: z.string().nullable().optional(),
});

export const linkShareSchema = z.object({
  vaultItemId: z.string().uuid("Invalid vault item ID"),
  encryptedTitle: z.string().min(1, "Encrypted title is required"),
  encryptedPayload: z.string().min(1, "Encrypted payload is required"),
  expiresAt: z.string().min(1, "Expiration is required"),
  viewLimit: z.number().int().min(1, "View limit must be at least 1"),
  passwordProtected: z.boolean(),
  passwordHash: z.string().optional(),
});

export const revokeShareSchema = z.object({
  id: z.string().uuid("Invalid share record ID"),
  type: z.enum(["email", "link"]),
});
