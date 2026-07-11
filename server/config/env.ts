/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.number().default(3000),
  JWT_SECRET: z.string().default("vaultx-default-super-secret-development-key-1337-v2"),
  JWT_REFRESH_SECRET: z.string().default("vaultx-default-super-secret-refresh-key-1337-v2"),
  DATABASE_URL: z.string().optional().default("postgresql://postgres:postgres@localhost:5432/vaultx"),
  CLIENT_URL: z.string().optional().default("http://localhost:3000"),
});

// Robust extraction of environment values, handling empty strings as undefined
const getEnvVal = (key: string): string | undefined => {
  const val = process.env[key];
  if (val === undefined || val === null || val.trim() === "") {
    return undefined;
  }
  return val.trim();
};

const rawPort = getEnvVal("PORT");
let parsedPort: number | undefined = undefined;
if (rawPort) {
  const p = parseInt(rawPort, 10);
  if (!isNaN(p)) {
    parsedPort = p;
  }
}

const rawEnv = {
  NODE_ENV: getEnvVal("NODE_ENV"),
  PORT: parsedPort,
  JWT_SECRET: getEnvVal("JWT_SECRET") || "vaultx-default-super-secret-development-key-1337-v2",
  JWT_REFRESH_SECRET: getEnvVal("JWT_REFRESH_SECRET") || "vaultx-default-super-secret-refresh-key-1337-v2",
  DATABASE_URL: getEnvVal("DATABASE_URL"),
  CLIENT_URL: getEnvVal("CLIENT_URL"),
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Environment configuration validation failed:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error(`Invalid or missing system environment variables: ${JSON.stringify(parsed.error.format())}`);
}

export const env = parsed.data;

