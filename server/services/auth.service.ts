/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { auditRepository } from "../repositories/audit.repository.js";

// Helper to hash incoming authKey on the server before storage/comparison
export function hashServerAuth(authKey: string, salt: string): string {
  return crypto
    .createHmac("sha256", salt)
    .update(authKey)
    .digest("hex");
}

export class AuthService {
  async getSalts(email: string) {
    const user = await userRepository.findByEmail(email);

    if (user) {
      return {
        exists: true,
        authSalt: user.authSalt,
        vaultSalt: user.vaultSalt,
      };
    } else {
      // Return fake but stable salts based on the email to prevent timing/enumeration attacks
      const fakeAuthSalt = crypto.createHash("sha256").update(email + "auth-salt-constant").digest("hex").slice(0, 32);
      const fakeVaultSalt = crypto.createHash("sha256").update(email + "vault-salt-constant").digest("hex").slice(0, 32);
      return {
        exists: false,
        authSalt: fakeAuthSalt,
        vaultSalt: fakeVaultSalt,
      };
    }
  }

  async register(email: string, authSalt: string, vaultSalt: string, authHash: string, ip?: string) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 409, message: "An account with this email already exists" };
    }

    // Hash the client's authHash once more on the server using the user's authSalt
    const serverAuthHash = hashServerAuth(authHash, authSalt);

    const newUser = await userRepository.create({
      email: email.toLowerCase().trim(),
      authHash: serverAuthHash,
      authSalt,
      vaultSalt,
    });

    // Create session token (Access Token)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Create a Refresh Token
    const refreshToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Audit log
    await auditRepository.createAuditLog(
      newUser.id,
      "USER_REGISTERED",
      "Account registered successfully",
      ip
    );

    return {
      token,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        authSalt: newUser.authSalt,
        vaultSalt: newUser.vaultSalt,
        publicKey: newUser.publicKey,
        encryptedPrivateKey: newUser.encryptedPrivateKey,
      },
    };
  }

  async login(email: string, authHash: string, ip?: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, message: "Invalid email or master password" };
    }

    // Verify incoming authHash against stored double-hash
    const calculatedHash = hashServerAuth(authHash, user.authSalt);

    if (calculatedHash !== user.authHash) {
      // Record failed login audit log
      await auditRepository.createAuditLog(
        user.id,
        "LOGIN_FAILED",
        "Failed login attempt - invalid master password",
        ip
      );
      throw { status: 401, message: "Invalid email or master password" };
    }

    // Create Access Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Create Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Audit log
    await auditRepository.createAuditLog(
      user.id,
      "USER_LOGGED_IN",
      "Successfully authenticated session",
      ip
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        authSalt: user.authSalt,
        vaultSalt: user.vaultSalt,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw { status: 401, message: "User session not found" };
      }

      // Generate new Access Token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return { token: accessToken };
    } catch (err) {
      throw { status: 403, message: "Invalid or expired refresh token" };
    }
  }

  async verifySession(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "User session not found" };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        authSalt: user.authSalt,
        vaultSalt: user.vaultSalt,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
      },
    };
  }
}

export const authService = new AuthService();
