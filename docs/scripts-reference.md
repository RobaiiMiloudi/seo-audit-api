# NPM Scripts Reference

This document provides a detailed overview of all the executable scripts available in the `package.json` file for the SEO Audit API. These scripts are designed to streamline development, testing, and production deployments.

You can run any of these scripts using your terminal:
```bash
npm run <script-name>
```

---

## 🛠️ Development Scripts

These scripts are used while actively writing code. They use `tsx` to automatically recompile TypeScript on the fly and restart the server when files change.

### `npm run dev`
- **Command:** `tsx watch src/server.ts`
- **Purpose:** Starts the main API server in "watch mode". 
- **When to use:** Use this when you are developing the API endpoints (Fastify routes) or modifying the core logic. Every time you save a file, the server will instantly reload.

### `npm run dev:worker`
- **Command:** `tsx watch src/worker.ts`
- **Purpose:** Starts the background worker (BullMQ/Redis) in "watch mode".
- **When to use:** The worker is responsible for running the heavy SEO scanning tasks in the background. Run this in a separate terminal window alongside `npm run dev` to process the audit jobs as you develop.

---

## 🧪 Testing Scripts

These scripts verify that your code works correctly.

### `npm run test`
- **Command:** `vitest run`
- **Purpose:** Runs all Unit Tests in the project exactly once using the Vitest framework.
- **When to use:** Use this in a CI/CD pipeline (like GitHub Actions) to ensure no code breaks before deploying, or to quickly verify your changes locally before committing. It does *not* require the server or database to be running.

### `npm run test:watch`
- **Command:** `vitest`
- **Purpose:** Starts the Vitest test runner in "watch mode".
- **When to use:** Use this while you are actively writing code. It will monitor your files and automatically re-run the relevant unit tests whenever you press "save".

### `npm run test:api`
- **Command:** `tsx scripts/test-api.ts`
- **Purpose:** Executes an integration test script that sends real HTTP requests to the local API.
- **When to use:** Use this to simulate a client interacting with the API (e.g., submitting an audit, checking status). **Note:** Both the API server (`npm run dev`) and the worker (`npm run dev:worker`) must be running before you execute this.

---

## ⚙️ Utility CLI Scripts

These are standalone scripts executed directly via `npx tsx` rather than an NPM script alias.

### `scripts/cli.ts`
- **Command:** `npx tsx scripts/cli.ts --url <target-url>`
- **Purpose:** A fully self-contained client that submits an audit to the local API and polls it until completion.
- **When to use:** Use this when integrating the SEO Audit tool with external systems (like a Python backend or bash pipeline). It adheres strictly to CLI best practices by printing progress logs to `stderr` and the final JSON payload to `stdout`. **Note:** Both the API server and worker must be running.

---
## 📦 Build & Production Scripts

These scripts are meant for preparing the application for a live environment.

### `npm run build`
- **Command:** `tsc`
- **Purpose:** Compiles all TypeScript files (`.ts`) in the `src/` directory into raw JavaScript (`.js`) and outputs them into the `dist/` directory based on the `tsconfig.json` configuration.
- **When to use:** Use this as the primary build step before deploying to a production server or Docker container.

### `npm run start`
- **Command:** `node dist/server.js`
- **Purpose:** Starts the production-ready API server using Node.js.
- **When to use:** Run this **after** running `npm run build`. This is how the server is launched in a live production environment (e.g., inside a Docker container or a VPS). It does not watch for file changes.

### `npm run start:worker`
- **Command:** `node dist/worker.js`
- **Purpose:** Starts the production-ready background worker using Node.js.
- **When to use:** Run this **after** running `npm run build`. This runs the production version of the BullMQ job processor.

---

## 🧹 Code Quality Scripts

### `npm run lint`
- **Command:** `eslint src`
- **Purpose:** Analyzes the source code to quickly find problems, enforce coding standards, and fix styling errors.
- **When to use:** Run this periodically during development or as a mandatory check in your CI/CD pipeline to keep the codebase clean and consistent.
