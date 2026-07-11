/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/salts", (req, res) => authController.getSalts(req, res));
router.post("/register", (req, res) => authController.register(req, res));
router.post("/login", (req, res) => authController.login(req, res));
router.post("/refresh", (req, res) => authController.refresh(req, res));
router.get("/me", authenticateToken, (req, res) => authController.me(req, res));
router.post("/keypair", authenticateToken, (req, res) => authController.saveKeys(req, res));
router.get("/public-key/:email", authenticateToken, (req, res) => authController.getPublicKey(req, res));

export default router;
