# NPM Scripts Reference

This document describes the executable scripts in `package.json`.

Run scripts with:

```bash
npm run <script-name>
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd run <script-name>
```

## Development Scripts

### `npm run dev`

- **Command:** `tsx watch src/server.ts`
- **Purpose:** Starts the Fastify API server in watch mode.
- **Requires:** Redis for enqueueing audit jobs.

### `npm run dev:worker`

- **Command:** `tsx watch src/worker.ts`
- **Purpose:** Starts the BullMQ worker in watch mode.
- **Requires:** Redis and the API-created jobs.

Run `dev` and `dev:worker` in separate terminals for local audit processing.

## Testing Scripts

### `npm run test`

- **Command:** `vitest run --exclude dist/**`
- **Purpose:** Runs source unit tests once.
- **Requires:** No API server, worker, Redis, or database service process.

The `dist/**` exclusion prevents compiled build artifacts from being discovered as test files after `npm run build`.

### `npm run test:watch`

- **Command:** `vitest --exclude dist/**`
- **Purpose:** Runs source unit tests in watch mode.

### `npm run test:api`

- **Command:** `tsx scripts/test-api.ts`
- **Purpose:** Sends real HTTP requests to the local API.
- **Requires:** API server, worker, and Redis to be running.

## Utility CLI Scripts

### `scripts/cli.ts`

- **Command:** `npx tsx scripts/cli.ts --url <target-url>`
- **Purpose:** Submits an audit to the API and polls until completion.
- **Requires:** API server, worker, and Redis to be running.

The CLI writes progress logs to `stderr` and prints the final JSON report to `stdout`, which makes it suitable for external automation.

## Build and Production Scripts

### `npm run build`

- **Command:** `tsc`
- **Purpose:** Compiles TypeScript from `src/` into `dist/`.

### `npm run start`

- **Command:** `node dist/server.js`
- **Purpose:** Starts the compiled production API server.
- **Requires:** `npm run build` first.

### `npm run start:worker`

- **Command:** `node dist/worker.js`
- **Purpose:** Starts the compiled production worker.
- **Requires:** `npm run build` first.

## Code Quality Scripts

### `npm run lint`

- **Command:** `eslint src`
- **Purpose:** Runs lint checks for source files.
