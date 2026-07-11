/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { dbConnection, DBAuditLog } from "../database/db.js";

export class AuditRepository {
  async getAuditLogs(userId: string): Promise<DBAuditLog[]> {
    const db = await dbConnection.load();
    return db.auditLogs
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAuditLog(
    userId: string,
    action: string,
    details: string,
    ipAddress?: string
  ): Promise<DBAuditLog> {
    const db = await dbConnection.load();
    const newLog: DBAuditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress,
    };
    db.auditLogs.push(newLog);
    await dbConnection.save(db);
    return newLog;
  }
}

export const auditRepository = new AuditRepository();
