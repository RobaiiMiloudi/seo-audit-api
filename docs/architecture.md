# Architecture

This project uses a modular backend structure. The goal is to keep each module focused, reusable, and easy to test.

## Design Principles

### Responsibility

Each module owns one clear reason to change:

- `audit` changes when audit workflow, scoring, or report meaning changes.
- `scraper` changes when page extraction changes.
- `performance` changes when performance data collection changes.
- `queue` changes when background job execution changes.
- `db` changes when persistence changes.
- `plugins` changes when Fastify infrastructure changes.

### Reusability

Reusable capabilities should not know about the feature that currently uses them.

For example, `scraper` exposes `scrapePage(url)` and returns page data. It does not know about job IDs, SQLite rows, audit scores, or API responses. That keeps it usable for future services such as broken-link checks, accessibility checks, content analysis, or competitor analysis.

### Cohesion

Things that change together live together. Extractors, scraper result types, and scraping entrypoints belong together. Audit scoring, suggestions, grades, and audit report types belong together. PageSpeed API details belong together.

### Coupling

Other modules should depend on public module entrypoints instead of deep internal files.

Preferred:

```ts
import { scrapePage } from '../scraper/index.js';
```

Avoid:

```ts
import { hybridScrape } from '../../lib/scanner/parser.js';
```

The public entrypoint hides internal structure and lets the module evolve without forcing unrelated callers to change.

### Dependency Direction

The dependency direction is:

```text
audit workflow -> scraper
audit workflow -> performance
audit workflow -> repository
queue worker   -> audit workflow capabilities
```

Lower-level capabilities should not import audit workflow code. For example, `scraper` should not import audit scoring or database code.

### Orchestration

`src/queue/jobs/auditJob.ts` coordinates the audit lifecycle:

```text
scrape page -> analyze performance -> score audit -> persist progress/result
```

It should coordinate the flow, but it should not own the scoring rules, scraper details, or PageSpeed API details.

### Domain vs Infrastructure

Domain code describes business meaning:

- audit score
- grade
- SEO suggestions
- audit status
- report shape

Infrastructure code describes technical mechanisms:

- Fastify routes
- BullMQ workers
- Redis queues
- SQLite storage
- Playwright rendering
- PageSpeed API calls

Keeping these separate makes the system easier to reason about and test.

## Current Module Boundaries

### `src/modules/audit`

Owns the SEO audit use case:

- `audit.route.ts`: HTTP route definitions.
- `audit.service.ts`: request-level audit operations.
- `audit.repository.ts`: audit result persistence.
- `audit.schema.ts`: request/response validation schemas.
- `audit.scorer.ts`: score, grade, and suggestion logic.
- `audit.types.ts`: audit-owned types.

### `src/modules/scraper`

Owns the public page extraction capability:

- `index.ts`: public scraper API.
- `scraper.service.ts`: reachability check plus page scraping.
- `scraper.types.ts`: scraper-owned result types.

Scanner internals currently remain in `src/lib/scanner`, but callers should use the `scraper` module entrypoint instead of importing scanner internals directly.

### `src/modules/performance`

Owns performance analysis:

- `index.ts`: public performance API.
- `performance.service.ts`: Google PageSpeed API integration.
- `performance.types.ts`: performance result type.

This makes the performance provider replaceable. A future Lighthouse CLI or custom Chrome runner can replace PageSpeed behind the same public API.

### `src/queue`

Owns background execution:

- `client.ts`: Redis/BullMQ queue connection.
- `worker.ts`: worker process setup.
- `jobs/auditJob.ts`: job orchestration.

### `src/db`

Owns SQLite setup and the `audit_results` table.

### `src/plugins`

Owns Fastify infrastructure plugins such as CORS, rate limiting, and sensible errors.

### `src/types`

Acts as a compatibility layer for shared type imports. New module-specific types should live with the module that owns them.

## Request Flow

```text
Client
  -> POST /api/audit
  -> audit.route.ts
  -> audit.service.ts
  -> audit.repository.ts creates pending row
  -> queue/client.ts enqueues BullMQ job
  -> queue/worker.ts receives job
  -> jobs/auditJob.ts orchestrates work
  -> scraper.scrapePage(url)
  -> performance.analyzePagePerformance(url)
  -> audit.scoreAudit(scrapeResult, performanceResult)
  -> audit.repository.ts saves progress/final result
  -> Client polls GET /api/audit/:jobId
```

## Testing Strategy

- Extractor tests validate scanner internals without running the API.
- Scoring tests should validate audit rules without Redis, Fastify, Playwright, or SQLite.
- API integration tests should run only when the API, worker, and Redis are available.
- Build validation uses `npm run build`.
- Unit validation uses `npm run test`.

## Future Refactor Direction

The next structural improvement would be moving scanner internals from `src/lib/scanner` into private folders under `src/modules/scraper`, while keeping `src/modules/scraper/index.ts` as the only public import path.
