# Error Reference

## Error Response Format
The API consistently returns errors in the following standard JSON format:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "url is required"
}
```

## Complete Error Reference

| Status Code | Error | Cause | Fix |
|---|---|---|---|
| 400 | Bad Request | Missing or invalid `url` field | Provide a valid URL string |
| 400 | Bad Request | `depth` is not a number between 1–5 | Use an integer between 1 and 5 |
| 404 | Not Found | `jobId` does not exist | Check the `jobId` is correct |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry, see rate limiting section |
| 500 | Internal Server Error | Unexpected server error | Retry after a delay, report if persistent |
| 503 | Service Unavailable | Worker is not running | The background worker process is down |

## Job-Level Errors
These errors do not return HTTP error codes. Instead, they appear inside the response body when polling `GET /api/audit/:jobId` and `status === "failed"`:

| Error message | Cause | Fix |
|---|---|---|
| `Could not reach URL` | Target site is down or blocked | Verify the URL is publicly accessible |
| `Scrape timeout` | Site took too long to respond | Try again or reduce depth |
| `Invalid HTML` | Page returned non-HTML content | Check the URL returns a real webpage |

## Rate Limiting
To protect system resources, the API enforces a rate limit of 100 requests per 15 minutes per IP address. When this limit is exceeded, the server responds with a `429 Too Many Requests` status code. 

The response will include a `Retry-After` header specifying the number of seconds to wait before making another request. Your client code should catch 429 errors, read the `Retry-After` header, and pause operations accordingly before retrying.

## Debugging Checklist
If your integration is failing, check the following:
1. Is Redis running?
2. Is the worker process running (`npm run dev:worker`)?
3. Is the target URL publicly accessible?
4. Is the `jobId` from the same environment (e.g., you aren't checking a dev job ID on production)?
