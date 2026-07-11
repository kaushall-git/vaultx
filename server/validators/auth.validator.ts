/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().email("Invalid email address format"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address format"),
  authSalt: z.string().min(16, "Salt must be at least 16 hex characters"),
  vaultSalt: z.string().min(16, "Salt must be at least 16 hex characters"),
  authHash: z.string().min(32, "Hash must be at least 32 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  authHash: z.string().min(32, "Hash must be at least 32 characters"),
});
