# API Reference

The SEO Audit API provides a simple interface to queue and retrieve background website audits.

Internally, the API route delegates to the `audit` module. The queued worker then coordinates `scraper`, `performance`, audit scoring, and persistence.

## 1. Request an Audit

`POST /api/audit`

Queues a target URL for a background SEO audit and returns a unique job ID used for tracking.

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | Full URL to audit. Must include `http://` or `https://`. |
| `depth` | integer | No | Crawl depth. Min: 1, max: 5, default: 1. Currently reserved for future multi-page auditing. |

### Example

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "depth": 1}'
```

### Success Response

`202 Accepted`

```json
{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

## 2. Get Audit Status and Result

`GET /api/audit/:jobId`

Retrieves the current status of an audit. Poll this endpoint until the status is `completed` or `failed`.

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `jobId` | string | Yes | Unique ID returned by `POST /api/audit`. |

### Example

```bash
curl http://localhost:3000/api/audit/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### Status Values

| Status | Meaning |
|---|---|
| `pending` | Job is queued and waiting for a worker |
| `scraping` | Worker is collecting page data |
| `analyzing_performance` | Partial scrape result is available while performance analysis is still running |
| `completed` | Final audit result is available |
| `failed` | Job failed; read the `error` field |

### In-Progress Response

`200 OK`

```json
{
  "status": "scraping",
  "url": "https://example.com",
  "result": null,
  "error": null,
  "createdAt": 1698246000
}
```

### Completed Response

`200 OK`

```json
{
  "status": "completed",
  "url": "https://example.com",
  "result": {
    "url": "https://example.com",
    "score": 75,
    "grade": "C"
  },
  "error": null,
  "createdAt": 1698246000
}
```

See [Report Format](report-format.md) for the full `result` object.

### Not Found

`404 Not Found`

Returned when the `jobId` does not exist.

```json
{
  "error": "Job not found"
}
```

## CLI Alternative

If you do not want to implement polling manually, use the CLI:

```bash
npx tsx scripts/cli.ts --url https://example.com
```

The CLI submits the audit, polls the status endpoint, writes progress logs to `stderr`, and prints the final report JSON to `stdout`.
