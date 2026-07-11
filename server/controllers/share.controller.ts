/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { emailShareSchema, linkShareSchema } from "../validators/share.validator.js";
import { shareService } from "../services/share.service.js";

export class ShareController {
  async shareByEmail(req: any, res: any) {
    try {
      const parsed = emailShareSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const result = await shareService.shareByEmail(req.user.userId, parsed.data, req.ip);
      return res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to share password";
      return res.status(status).json({ error: msg });
    }
  }

  async generateShareLink(req: any, res: any) {
    try {
      const parsed = linkShareSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const result = await shareService.generateShareLink(req.user.userId, parsed.data, req.ip);
      return res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to generate share link";
      return res.status(status).json({ error: msg });
    }
  }

  async getShareLinkByToken(req: any, res: any) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: "Share token is required" });
      }

      const result = await shareService.getShareLinkByToken(token, req.ip);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to retrieve shared link";
      return res.status(status).json({ error: msg });
    }
  }

  async acceptShare(req: any, res: any) {
    try {
      const { token } = req.params; // In standard routing, we map this
      const result = await shareService.acceptShare(token, req.user.userId, req.ip);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to accept share invitation";
      return res.status(status).json({ error: msg });
    }
  }

  async revokeShare(req: any, res: any) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Share record ID is required for revocation" });
      }

      const result = await shareService.revokeShare(id, req.user.userId, req.ip);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to revoke share";
      return res.status(status).json({ error: msg });
    }
  }

  async getMyShared(req: any, res: any) {
    try {
      const result = await shareService.getMyShared(req.user.userId);
      return res.json(result);
    } catch (error: any) {
      console.error("Get my shared items controller error:", error);
      return res.status(500).json({ error: "Failed to fetch shared items" });
    }
  }

  async getReceivedShares(req: any, res: any) {
    try {
      const result = await shareService.getReceivedShares(req.user.userId);
      return res.json(result);
    } catch (error: any) {
      console.error("Get received shares controller error:", error);
      return res.status(500).json({ error: "Failed to fetch received shares" });
    }
  }

  async updateShare(req: any, res: any) {
    try {
      const { id } = req.params;
      const { encryptedTitle, encryptedPayload } = req.body;
      if (!encryptedTitle || !encryptedPayload) {
        return res.status(400).json({ error: "encryptedTitle and encryptedPayload are required" });
      }

      const result = await shareService.updateShareDetails(id, req.user.userId, encryptedTitle, encryptedPayload, req.ip);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to update shared item";
      return res.status(status).json({ error: msg });
    }
  }
}

export const shareController = new ShareController();
