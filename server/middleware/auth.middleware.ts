/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
  ip?: string;
}

export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.split(" ")[1];

  // Also support cookie-based tokens for production-ready setups
  let cookieToken = req.cookies?.accessToken;
  if (!cookieToken && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(";");
    const parsedCookies: any = {};
    rawCookies.forEach((c: string) => {
      const parts = c.split("=");
      if (parts.length === 2) {
        parsedCookies[parts[0].trim()] = parts[1].trim();
      }
    });
    cookieToken = parsedCookies.accessToken;
  }
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Access token is required. Please login." });
  }

  jwt.verify(token, env.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Session token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(403).json({ error: "Invalid or corrupt session token" });
    }
    req.user = user;
    next();
  });
}
