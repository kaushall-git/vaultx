/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { emailSchema, registerSchema, loginSchema } from "../validators/auth.validator.js";
import { authService } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";

export class AuthController {
  async getSalts(req: any, res: any) {
    try {
      const parsed = emailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const result = await authService.getSalts(parsed.data.email);
      return res.json(result);
    } catch (error: any) {
      console.error("Salts controller error:", error);
      return res.status(500).json({ error: "Failed to fetch cryptographic salts" });
    }
  }

  async register(req: any, res: any) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { email, authSalt, vaultSalt, authHash } = parsed.data;
      const result = await authService.register(email, authSalt, vaultSalt, authHash, req.ip);

      // Optionally set Secure HttpOnly cookies for enterprise grade security
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to register user";
      if (status !== 500) {
        return res.status(status).json({ error: msg });
      }
      console.error("Register controller error:", error);
      return res.status(500).json({ error: msg });
    }
  }

  async login(req: any, res: any) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { email, authHash } = parsed.data;
      const result = await authService.login(email, authHash, req.ip);

      // Optionally set Secure HttpOnly cookies
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const msg = error.message || "Failed to authenticate session";
      if (status !== 500) {
        return res.status(status).json({ error: msg });
      }
      console.error("Login controller error:", error);
      return res.status(500).json({ error: msg });
    }
  }

  async refresh(req: any, res: any) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const result = await authService.refresh(refreshToken);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 403;
      return res.status(status).json({ error: error.message || "Failed to rotate token" });
    }
  }

  async me(req: any, res: any) {
    try {
      const result = await authService.verifySession(req.user.userId);
      return res.json(result);
    } catch (error: any) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || "Session verification failed" });
    }
  }

  async saveKeys(req: any, res: any) {
    try {
      const { publicKey, encryptedPrivateKey } = req.body;
      if (!publicKey || !encryptedPrivateKey) {
        return res.status(400).json({ error: "publicKey and encryptedPrivateKey are required" });
      }

      await userRepository.update(req.user.userId, {
        publicKey,
        encryptedPrivateKey,
      });

      return res.json({ success: true, message: "Secure sharing keys saved successfully" });
    } catch (error: any) {
      console.error("Save keys error:", error);
      return res.status(500).json({ error: "Failed to save sharing keys" });
    }
  }

  async getPublicKey(req: any, res: any) {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.publicKey) {
        return res.status(400).json({ error: "User has not initialized sharing keys" });
      }

      return res.json({
        userId: user.id,
        email: user.email,
        publicKey: user.publicKey,
      });
    } catch (error: any) {
      console.error("Get public key error:", error);
      return res.status(500).json({ error: "Failed to fetch user public key" });
    }
  }
}

export const authController = new AuthController();
