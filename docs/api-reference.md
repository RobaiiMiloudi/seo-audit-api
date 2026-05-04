# API Reference

The SEO Audit API provides a simple interface to queue and retrieve background website audits.

---

## 1. Request an Audit
`POST /api/audit`

Queues a target URL for a background SEO audit and returns a unique Job ID used for tracking.

**Request Body (JSON)**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | The full URL to audit (must include `http://` or `https://` and a valid domain). |
| `depth` | integer | No | Crawl depth. Min: 1, Max: 5. Default: 1. *(Currently reserved for future multi-page scraping features).* |

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "depth": 1}'
```
> **Tip for System Integrations:** If you don't want to handle the async polling logic manually via HTTP, you can use the provided CLI script (`npx tsx scripts/cli.ts --url https://example.com`) which handles the entire POST + Poll lifecycle and outputs the final JSON.

**Success Response (`202 Accepted`)**

```json
{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

---

## 2. Get Audit Status & Result
`GET /api/audit/:jobId`

Retrieves the current status of an audit. Because audits take time, you must poll this endpoint until the status returns `completed` or `failed`.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `jobId` | string | Yes | The unique ID returned by the POST request. |

**Example Request:**

```bash
curl http://localhost:3000/api/audit/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response - Pending/Active (`200 OK`)**

```json
{
  "status": "pending",
  "url": "https://example.com",
  "result": null,
  "error": null,
  "createdAt": 1698246000
}
```

**Response - Completed (`200 OK`)**

```json
{
  "status": "completed",
  "url": "https://example.com",
  "result": { ... Full Audit Object ... },
  "error": null,
  "createdAt": 1698246000
}
```
*(See the [Report Format](report-format.md) documentation for the exact structure of the `result` object).*

**Error Responses**

* `404 Not Found`: Returned if the `jobId` does not exist in the database.

```json
{
  "error": "Job not found"
}
```