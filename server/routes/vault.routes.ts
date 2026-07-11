/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { vaultController } from "../controllers/vault.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth token validation to all vault/audit-logs paths
router.use(authenticateToken);

router.get("/", (req, res) => vaultController.getItems(req, res));
router.post("/", (req, res) => vaultController.createItem(req, res));
router.put("/:id", (req, res) => vaultController.updateItem(req, res));
router.delete("/:id", (req, res) => vaultController.deleteItem(req, res));
router.get("/audit-logs", (req, res) => vaultController.getAuditLogs(req, res));

export default router;
