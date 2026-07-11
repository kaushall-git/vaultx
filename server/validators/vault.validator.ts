/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const createVaultItemSchema = z.object({
  category: z.enum(["login", "secure_note", "card", "identity"]),
  encryptedTitle: z.string().min(1, "Encrypted title is required"),
  encryptedPayload: z.string().min(1, "Encrypted payload is required"),
  isFavorite: z.boolean().optional().default(false),
});

export const updateVaultItemSchema = z.object({
  encryptedTitle: z.string().min(1).optional(),
  encryptedPayload: z.string().min(1).optional(),
  isFavorite: z.boolean().optional(),
});
