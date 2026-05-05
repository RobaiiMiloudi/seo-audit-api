# Error Reference

## Error Response Format

Fastify validation and application errors are returned as JSON.

Example:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid URL format. Please include http:// or https:// and a valid domain."
}
```

## HTTP Error Reference

| Status Code | Error | Cause | Fix |
|---|---|---|---|
| 400 | Bad Request | Missing or invalid `url` field | Provide a valid URL string including `http://` or `https://` |
| 400 | Bad Request | `depth` is not an integer between 1 and 5 | Use an integer between 1 and 5 |
| 404 | Not Found | `jobId` does not exist | Check the `jobId` and environment |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry |
| 500 | Internal Server Error | Unexpected server error | Retry after a delay and inspect logs if persistent |

## Job-Level Errors

These errors appear in `GET /api/audit/:jobId` when `status` is `failed`.

| Error message | Cause | Fix |
|---|---|---|
| `Target URL is unreachable.` | Reachability check failed | Verify the URL is publicly accessible |
| `Connection failed or timed out. The server might be down or blocking automated requests.` | Network failure during reachability check | Retry later or test the URL manually |
| `Domain not found. Please check if the URL is spelled correctly and the site is online.` | DNS lookup failed | Correct the domain or try another URL |
| `Invalid Content Type. The URL must point to an HTML webpage, not a file or image.` | Target URL does not return HTML | Use a webpage URL instead of a file/image URL |

## Performance Analysis Failures

PageSpeed/Lighthouse failures do not necessarily fail the whole job. If scraping succeeds but performance analysis fails, the audit can still complete with `lighthouse: null` and a warning suggestion.

The performance module owns this behavior so the audit workflow can continue even when the external PageSpeed service is slow or unavailable.

## Rate Limiting

The API enforces a rate limit of 100 requests per 15 minutes per IP address. When exceeded, the server responds with `429 Too Many Requests`.

Clients should retry later and avoid polling more frequently than every 2 seconds.

## Debugging Checklist

1. Is Redis running?
2. Is the API server running (`npm run dev`)?
3. Is the worker process running (`npm run dev:worker`)?
4. Is the target URL publicly accessible?
5. Is the `jobId` from the same environment?
6. Are PageSpeed failures expected because no API key is configured or the external service is unavailable?
