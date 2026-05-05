# SEO Audit API

High-performance asynchronous SEO auditing microservice.

## What it does

The SEO Audit API queues website audits, processes them in a background worker, and returns structured SEO reports through a polling API or CLI. It extracts page metadata, content structure, image data, links, social tags, technical signals, and performance metrics, then calculates an SEO score with actionable suggestions.

The service is intentionally split into focused modules:

- `audit` owns the audit workflow, scoring, report meaning, and persistence contract.
- `scraper` owns reusable page extraction.
- `performance` owns PageSpeed/Lighthouse analysis.
- `queue` owns BullMQ background execution.
- `db` owns local SQLite persistence.
- `plugins` owns Fastify infrastructure concerns.

See [docs/architecture.md](docs/architecture.md) for the full module design.

## Prerequisites

- Node.js 20+
- Docker, for Redis
- Git

## Installation

```bash
git clone <repository-url>
cd seo-audit-tool
npm install
cp .env.example .env
```

## Running Redis

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

## Running the API

Run the API and worker in separate terminals:

```bash
npm run dev
```

```bash
npm run dev:worker
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd run dev
npm.cmd run dev:worker
```

The API receives HTTP requests and enqueues jobs. The worker processes queued audits. Both must be running for audits to complete.

## CLI Access

The CLI submits an audit to the API, polls until completion, writes progress logs to `stderr`, and prints the final report JSON to `stdout`.

```bash
npx tsx scripts/cli.ts --url https://example.com
```

On Windows PowerShell:

```powershell
npx.cmd tsx scripts/cli.ts --url https://example.com
```

The CLI requires Redis, the API server, and the worker to be running.

## Testing

```bash
npm run build
npm run test
```

Unit tests focus on extraction logic and do not require the API, worker, Redis, or SQLite service processes to be running. The test script excludes `dist/` so compiled build output does not get picked up as test input.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/audit` | Request a new SEO audit |
| GET | `/api/audit/:jobId` | Poll the status and result of an audit |

### Request an Audit

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "depth": 1}'
```

Response:

```json
{
  "jobId": "12345-abcde"
}
```

### Poll Audit Status

```bash
JOB_ID="12345-abcde"
STATUS="pending"

while [ "$STATUS" = "pending" ] || [ "$STATUS" = "scraping" ] || [ "$STATUS" = "analyzing_performance" ]; do
  RESPONSE=$(curl -s http://localhost:3000/api/audit/$JOB_ID)
  STATUS=$(echo $RESPONSE | jq -r .status)

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo $RESPONSE | jq .
    break
  fi

  echo "Job $STATUS. Waiting 3 seconds..."
  sleep 3
done
```

## Folder Structure

```text
seo-audit-tool/
|-- src/
|   |-- modules/
|   |   |-- audit/        # Audit workflow, scoring, report types, repository
|   |   |-- scraper/      # Public page scraping API and scraper-owned types
|   |   `-- performance/  # PageSpeed/Lighthouse analysis
|   |-- lib/scanner/      # Scanner internals and extractors
|   |-- queue/            # BullMQ queue and worker configuration
|   |-- db/               # SQLite client and schema initialization
|   |-- plugins/          # Fastify plugins
|   |-- types/            # Compatibility re-exports for shared imports
|   `-- app.ts            # Fastify application assembly
|-- docs/                 # Project documentation
`-- package.json
```

## Tech Stack

| Tool | Purpose |
|---|---|
| Fastify | HTTP server |
| TypeScript | Type safety |
| BullMQ | Job queue |
| Redis | Queue backend |
| better-sqlite3 | Local audit persistence |
| Cheerio | Static HTML parsing |
| Playwright | Dynamic page rendering fallback |
| Google PageSpeed API | Performance metrics |
| Zod | Request validation and OpenAPI schemas |
| Vitest | Unit testing |

## License

MIT License
