/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { env } from "./server/config/env.js";
import rootRouter from "./server/routes/index.js";
import shareRoutes from "./server/routes/share.routes.js";

const app = express();

// Global Middlewares
app.use(express.json());

// API Routes
app.use("/api/v1", rootRouter);
app.use("/api/share", shareRoutes);

// Serve Static Assets & SPA Fallback via Vite
async function startServer() {
  if (env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`VaultX full-stack production-ready server running on http://localhost:${env.PORT}`);
  });
}

startServer();
