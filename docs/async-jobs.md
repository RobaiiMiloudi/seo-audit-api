# Async Jobs Pattern

## Why async?

SEO audits include page scraping, extraction, performance analysis, scoring, and persistence. These steps can take long enough that a single synchronous HTTP request would be fragile. The asynchronous pattern returns a `jobId` immediately, then lets a background worker finish the audit while the client polls for status.

## Full Flow

```text
Client -> POST /api/audit -> API returns jobId
                                  |
                                  v
                         Job added to Redis queue
                                  |
                                  v
                         Worker picks up job
                                  |
                                  v
             scraper.scrapePage + performance.analyzePagePerformance
                                  |
                                  v
                         audit.scoreAudit
                                  |
                                  v
                         Result saved to SQLite
                                  |
                                  v
Client -> GET /api/audit/:jobId -> returns status/result
```

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `audit.route.ts` | Accepts HTTP requests and returns HTTP responses |
| `audit.service.ts` | Creates audit jobs and reads audit status |
| `audit.repository.ts` | Saves and loads audit records |
| `queue/client.ts` | Configures the BullMQ queue connection |
| `queue/worker.ts` | Starts the worker process |
| `queue/jobs/auditJob.ts` | Orchestrates each audit job |
| `scraper` | Extracts page data |
| `performance` | Fetches PageSpeed/Lighthouse metrics |
| `audit.scorer.ts` | Calculates score, grade, and suggestions |

## Job Status Reference

| Status | Meaning | What to do |
|---|---|---|
| `pending` | Waiting in queue | Keep polling |
| `scraping` | Worker is collecting page data | Keep polling |
| `analyzing_performance` | Partial scrape result is saved while performance analysis continues | Keep polling |
| `completed` | Done | Read the `result` field |
| `failed` | Error occurred | Read the `error` field |

## Polling Best Practices

- Poll every 3-5 seconds.
- Do not poll faster than every 2 seconds.
- Stop polling immediately when status is `completed` or `failed`.
- Set a client-side timeout, such as 5 minutes.

## Code Examples

### Bash

```bash
JOB_ID="your-job-id"
STATUS="pending"

while [ "$STATUS" = "pending" ] || [ "$STATUS" = "scraping" ] || [ "$STATUS" = "analyzing_performance" ]; do
  RESPONSE=$(curl -s http://localhost:3000/api/audit/$JOB_ID)
  STATUS=$(echo $RESPONSE | jq -r .status)

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "Done! Result:"
    echo $RESPONSE | jq .
    break
  fi

  echo "Status: $STATUS. Checking again in 3 seconds..."
  sleep 3
done
```

### JavaScript

```javascript
async function pollAudit(jobId) {
  const maxPollTime = 5 * 60 * 1000;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (Date.now() - startTime > maxPollTime) {
        clearInterval(interval);
        return reject(new Error('Polling timed out'));
      }

      try {
        const response = await fetch(`http://localhost:3000/api/audit/${jobId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error(data.error));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 3000);
  });
}
```

### Python

```python
import requests
import time

def poll_audit(job_id):
    url = f"http://localhost:3000/api/audit/{job_id}"
    max_retries = 100

    for _ in range(max_retries):
        response = requests.get(url)
        data = response.json()
        status = data.get("status")

        if status == "completed":
            return data.get("result")
        if status == "failed":
            raise Exception(f"Job failed: {data.get('error')}")

        time.sleep(3)

    raise Exception("Polling timed out")
```

### Node.js CLI

```bash
npx tsx scripts/cli.ts --url https://example.com
```

The CLI handles the POST and polling lifecycle. It writes progress updates to `stderr` and prints the final JSON result to `stdout`.

## Failed Jobs

When a job fails, `status` becomes `failed` and the `error` field contains the reason. Failed jobs are final. Submit a new `POST /api/audit` request to retry.
