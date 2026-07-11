/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import { dbConnection, DBUser } from "../database/db.js";

export class UserRepository {
  async findByEmail(email: string): Promise<DBUser | undefined> {
    const db = await dbConnection.load();
    const cleanEmail = email.toLowerCase().trim();
    return db.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
  }

  async findById(id: string): Promise<DBUser | undefined> {
    const db = await dbConnection.load();
    return db.users.find((u) => u.id === id);
  }

  async create(user: Omit<DBUser, "id" | "createdAt">): Promise<DBUser> {
    const db = await dbConnection.load();
    const newUser: DBUser = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    await dbConnection.save(db);
    return newUser;
  }

  async update(id: string, updates: Partial<Pick<DBUser, "publicKey" | "encryptedPrivateKey">>): Promise<DBUser | undefined> {
    const db = await dbConnection.load();
    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return undefined;

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updates,
    };
    await dbConnection.save(db);
    return db.users[userIndex];
  }
}

export const userRepository = new UserRepository();
