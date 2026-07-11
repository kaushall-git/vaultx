/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { shareController } from "../controllers/share.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Specific routes first
router.post("/email", authenticateToken, (req, res) => shareController.shareByEmail(req, res));
router.post("/link", authenticateToken, (req, res) => shareController.generateShareLink(req, res));
router.get("/my", authenticateToken, (req, res) => shareController.getMyShared(req, res));
router.get("/received", authenticateToken, (req, res) => shareController.getReceivedShares(req, res));

// Revoke can be called with DELETE or POST
router.delete("/revoke", authenticateToken, (req, res) => shareController.revokeShare(req, res));
router.post("/revoke", authenticateToken, (req, res) => shareController.revokeShare(req, res));

// Token-based routes (does NOT require user authentication for viewing links, but may for accepting shares)
// Accept is typically authenticated since it maps to the recipient user accepting an invitation
router.post("/:token/accept", authenticateToken, (req, res) => shareController.acceptShare(req, res));
router.put("/:id", authenticateToken, (req, res) => shareController.updateShare(req, res));

// View link is public (zero-knowledge decryption happens on the client)
router.get("/:token", (req, res) => shareController.getShareLinkByToken(req, res));

export default router;
