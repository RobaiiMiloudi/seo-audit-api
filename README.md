# SEO Audit API
High-performance asynchronous SEO auditing microservice.

## What it does
The SEO Audit API is a background-processing tool that crawls and analyzes web pages for SEO compliance. It extracts meta tags, analyzes content structure (like H1s and headings), checks image alt attributes, parses social tags (OpenGraph, Twitter Cards), and verifies technical data such as reachability. Because deep site audits can take several minutes to complete, this API uses an asynchronous job queue pattern—returning a tracking ID immediately while the heavy lifting happens in the background.

## Prerequisites
- Node.js 20+
- Docker (for running the Redis container)
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
```bash
npm run dev
```

## Running the Worker
```bash
npm run dev:worker
```
*Note: The API handles HTTP requests and enqueues jobs, while the worker process runs the background scraping tasks. Both must be running simultaneously for audits to process.*

## Testing
The project uses Vitest for extremely fast, zero-config unit testing.
```bash
# Run all tests once (ideal for CI/CD)
npm run test

# Run tests in watch mode (ideal for active development)
npm run test:watch
```
*Note: Unit tests test the core scanner logic and do not require the API or Worker to be running.*

## CLI Access (System-to-System)
If you have another service or script that needs to programmatically run an audit and capture the JSON result without writing custom polling logic, you can use the built-in CLI script:
```bash
npx tsx scripts/cli.ts --url https://example.com
```
*This script will stream progress logs to `stderr` and print the final JSON result strictly to `stdout`, making it perfectly clean for parsing in Python, Go, PHP, or bash scripts.*

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

### Poll Audit Status (Polling Loop Example)
```bash
JOB_ID="12345-abcde"
STATUS="pending"

while [ "$STATUS" = "pending" ] || [ "$STATUS" = "active" ]; do
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
```
seo-audit-tool/
├── src/
│   ├── modules/       # Domain-specific logic (e.g., audit route, service, repository)
│   ├── plugins/       # Fastify plugins (cors, swagger, sensible, rateLimit)
│   ├── queue/         # BullMQ queue and worker configuration
│   ├── lib/           # Core libraries and scraping engine logic
│   ├── types/         # Global TypeScript interfaces and types
│   └── app.ts         # Fastify application assembly
├── docs/              # Project documentation
└── package.json       # Project dependencies and scripts
```

## Tech Stack

| Tool | Purpose |
|---|---|
| Fastify | High-performance HTTP server |
| TypeScript | Type safety and developer experience |
| BullMQ | Reliable job queuing and background processing |
| Redis | Fast in-memory storage for the job queue |
| better-sqlite3 | Persistent local database for audit results |
| Zod | Schema validation and type inference |

## License
MIT License
