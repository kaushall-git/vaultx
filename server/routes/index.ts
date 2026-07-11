/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import authRoutes from "./auth.routes.js";
import vaultRoutes from "./vault.routes.js";
import shareRoutes from "./share.routes.js";

const rootRouter = express.Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/vault", vaultRoutes);
rootRouter.use("/share", shareRoutes);

// Backwards compatibility endpoint for direct GET /api/v1/audit-logs
import { vaultController } from "../controllers/vault.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
rootRouter.get("/audit-logs", authenticateToken, (req, res) => vaultController.getAuditLogs(req, res));

export default rootRouter;
