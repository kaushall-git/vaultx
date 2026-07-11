# VaultX Development Guide

Follow these instructions to run, develop, and build the VaultX application locally.

---

## 1. Prerequisites

Make sure you have Node.js installed on your development machine:
*   **NodeJS**: `v18+` or `v20+` (native TS support recommended)
*   **NPM**: `v9+`

---

## 2. Installation

Install all required baseline dependencies from package manifest:
```bash
npm install
```

---

## 3. Local Development Server

Run the full-stack Express + Vite application using the `tsx` wrapper:
```bash
npm run dev
```
The application compiles on the fly and runs on `http://localhost:3000`.

---

## 4. Linting and Diagnostics

Validate typescript types and syntax constraints:
```bash
npm run lint
```

---

## 5. Production Compilation

Compile static client files via Vite and bundle server code using esbuild:
```bash
npm run build
```
Compiled outputs are written to the `/dist/` folder:
*   `/dist/index.html` and static bundles.
*   `/dist/server.cjs` representing the fast, bundled server entry point.

Run the production server:
```bash
npm run start
```
