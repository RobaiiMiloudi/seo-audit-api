import { parseArgs } from 'node:util';

// 1. Parse command line arguments
const { values } = parseArgs({
  options: {
    url: { type: 'string', short: 'u' },
    host: { type: 'string', short: 'h', default: 'http://localhost:3000' },
  },
});

if (!values.url) {
  console.error('Error: Please provide a target URL using --url or -u');
  process.exit(1);
}

const targetUrl = values.url;
const apiBase = values.host;

async function runCLI() {
  try {
    // Note: We use console.error for status messages so they go to "stderr".
    // This leaves "stdout" perfectly clean for the final JSON payload.
    console.error(`[INFO] Submitting audit for: ${targetUrl}`);

    // Step 1: Submit the audit
    const submitRes = await fetch(`${apiBase}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, depth: 1 })
    });

    if (!submitRes.ok) {
      throw new Error(`Failed to queue job: ${submitRes.statusText}`);
    }

    const { jobId } = await submitRes.json();
    console.error(`[INFO] Job queued. ID: ${jobId}. Polling for results...`);

    // Step 2: Poll for completion
    while (true) {
      const statusRes = await fetch(`${apiBase}/api/audit/${jobId}`);
      const statusData = await statusRes.json();

      if (statusData.status === 'completed') {
        console.error(`[INFO] Audit complete!`);

        // Output the actual result to stdout!
        // Another service parsing this command will ONLY read this output.
        console.log(JSON.stringify(statusData.result, null, 2));
        process.exit(0);
      }

      if (statusData.status === 'failed') {
        console.error(`[ERROR] Audit failed: ${statusData.error}`);
        process.exit(1); // Exit code 1 means error
      }

      // Print progress without moving to a new line
      process.stderr.write(`[INFO] Status: ${statusData.status}... waiting.\n`);
      await new Promise((r) => setTimeout(r, 3000)); // wait 3 seconds
    }
  } catch (err: any) {
    console.error(`[FATAL ERROR] ${err.message}`);
    process.exit(1);
  }
}

runCLI();
