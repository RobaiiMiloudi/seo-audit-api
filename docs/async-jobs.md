# Async Jobs Pattern

## Why async?
SEO audits process significant amounts of data. The API must scrape target pages, extract assets, and analyze structure. Depending on the depth of the crawl and target site speeds, this process can take anywhere from 30 seconds to several minutes. A standard synchronous HTTP request would simply time out. The asynchronous pattern solves this by returning a tracking ID immediately, allowing the server to do the heavy lifting in the background while the client checks back for the result.

## The Full Flow

```text
Client → POST /api/audit → API returns jobId (instant)
                                   ↓
                             Job added to Redis queue
                                   ↓
                          Worker picks up job (background)
                                   ↓
                          Scraper runs (30s - 3min)
                                   ↓
                          Result saved to SQLite
                                   ↓
Client → GET /api/audit/:jobId → returns completed result
```

## Job Status Reference

| Status | Meaning | What to do |
|---|---|---|
| `pending` | Waiting in queue | Keep polling |
| `active` | Worker is scraping | Keep polling |
| `completed` | Done | Read the `result` field |
| `failed` | Error occurred | Read the `error` field |

## Polling Best Practices
- Poll every 3–5 seconds
- Never poll faster than every 2 seconds to avoid overwhelming the server
- Stop polling immediately when status is `completed` or `failed`
- Set a maximum timeout on the client side (e.g. 5 minutes) so your client doesn't loop forever

## Code Examples

### bash (curl)
```bash
JOB_ID="your-job-id"
STATUS="pending"

while [ "$STATUS" = "pending" ] || [ "$STATUS" = "active" ]; do
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

### JavaScript (fetch)
```javascript
async function pollAudit(jobId) {
  const maxPollTime = 5 * 60 * 1000; // 5 minutes
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
        // If pending or active, do nothing and wait for next interval
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 3000); // Poll every 3 seconds
  });
}
```

### Python (requests)
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
        elif status == "failed":
            raise Exception(f"Job failed: {data.get('error')}")
            
        time.sleep(3) # Wait 3 seconds before polling again
        
    raise Exception("Polling timed out")
```

### Node.js (Built-in CLI Script)
If you are integrating with a system that can execute terminal commands (like a Python subprocess or a bash script), you don't need to write the polling logic from scratch! We provide a built-in CLI script.
```bash
# Execute the script
npx tsx scripts/cli.ts --url https://example.com
```
*The script automatically handles the POST request and the polling loop. It writes status updates to `stderr` and prints the final JSON result to `stdout`.*

## What to do when a job fails
When a job fails, the `status` will be set to `"failed"` and an `error` field will be populated with the failure reason. This indicates the background job couldn't complete successfully. Once a job has failed, its state is final. To try again, you must submit a new `POST` request to receive a new `jobId`. See the Errors documentation for details on specific error strings.
