// scripts/test-api.ts
import { input, confirm } from '@inquirer/prompts';
import kleur from 'kleur';

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/audit`;

// --- HELPERS ---
const drawDivider = (color = kleur.gray) => console.log(color('─'.repeat(60)));

/**
 * Renders the actionable suggestions found during the audit.
 */
function renderSuggestions(suggestions: any[]) {
    if (!suggestions || suggestions.length === 0) {
        console.log(kleur.green('\n✨ No major SEO issues found! Great job.'));
        return;
    }

    console.log(kleur.bold().yellow(`\n💡 ACTIONABLE SUGGESTIONS (${suggestions.length})`));
    drawDivider(kleur.yellow);

    suggestions.forEach((s, index) => {
        const severityColor = s.severity === 'critical' ? kleur.bgRed().white :
            (s.severity === 'warning' ? kleur.bgYellow().black : kleur.bgCyan().black);

        console.log(`${kleur.bold(index + 1 + '.')} ${severityColor(` ${s.severity.toUpperCase()} `)} ${kleur.bold(s.message)}`);
        console.log(`${kleur.cyan('   Action: ')}   ${s.action}`);
        console.log(`${kleur.dim('   Rationale:')} ${s.rationale}`);
        console.log(''); // Spacing
    });
}

/**
 * Renders the audit data summary.
 */
function renderAuditSummary(auditData: any, isPartial = false) {
    if (!auditData) return;

    if (isPartial) {
        console.log(kleur.italic().yellow('\n[LIVE PREVIEW - Data gathered from HTML Scrape]'));
    } else {
        console.log(kleur.bold().green('\n[FINAL REPORT - Full Analysis Complete]'));
    }

    drawDivider(isPartial ? kleur.yellow : kleur.green);
    console.log(`${kleur.bold('URL:')}    ${auditData.url}`);

    const score = auditData.score;
    const scoreColor = score >= 90 ? kleur.green : (score >= 70 ? kleur.yellow : kleur.red);

    if (!isPartial) {
        console.log(`${kleur.bold('Score:')}  ${scoreColor(score + '/100')} [Grade: ${auditData.grade}]`);
    } else {
        console.log(`${kleur.bold('Score:')}  ${scoreColor(score + '/100')} (Preliminary)`);
    }

    const meta = auditData.data?.meta;
    if (meta) {
        console.log(`${kleur.bold('Title:')}  ${meta.title.value || kleur.red('Missing')}`);
    }

    if (auditData.data) {
        const content = auditData.data.content;
        const imgs = auditData.data.images;
        const tech = auditData.data.technical;

        console.log(`${kleur.bold('Stats:')}  ${content.wordCount.count} words | ${imgs.totalImages} images | ${tech.security.isHttps ? 'HTTPS ✅' : 'No HTTPS ❌'}`);
    }

    if (auditData.lighthouse) {
        const lh = auditData.lighthouse;
        console.log(`${kleur.bold('Speed:')}  Perf Score: ${Math.round(lh.performanceScore * 100)}% | LCP: ${Math.round(lh.largestContentfulPaint)}ms`);
    }

    drawDivider(isPartial ? kleur.yellow : kleur.green);
}

// --- MAIN SCRIPT ---
async function main() {
    console.clear();
    console.log(kleur.bold().bgCyan().black('  SEO AUDIT API - CONCURRENT PROGRESSIVE TESTER  '));
    console.log(kleur.dim(`Targeting: ${API_URL}`));
    drawDivider();

    let keepRunning = true;

    while (keepRunning) {
        try {
            const targetUrl = await input({
                message: 'Enter the URL to audit:',
                validate: (value) => {
                    try { new URL(value); return true; }
                    catch { return 'Please enter a valid URL (include http/https)'; }
                }
            });

            const proceed = await confirm({ message: `Start audit for ${kleur.green(targetUrl)}?` });

            if (!proceed) {
                console.log(kleur.yellow('\nCancelled.'));
            } else {
                // 1. Submit Job (Depth is hardcoded to 1 here)
                const submitResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: targetUrl, depth: 1 })
                });

                if (!submitResponse.ok) throw new Error(`API Error: ${submitResponse.status}`);
                const { jobId } = await submitResponse.json();

                console.log(`\n${kleur.cyan('Job ID:')} ${jobId}`);
                drawDivider();

                // 2. Progressive Polling Loop
                let finalData = null;
                let showedPartial = false;
                const startTime = Date.now();

                while (true) {
                    const statusRes = await fetch(`${API_URL}/${jobId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === 'completed') {
                        finalData = statusData.result;
                        break;
                    }

                    if (statusData.status === 'failed') {
                        console.log(kleur.red(`\n✖ Failed: ${statusData.error}`));
                        break;
                    }

                    const hasData = statusData.result !== null;

                    if (hasData && !showedPartial) {
                        process.stdout.write('\r' + ' '.repeat(50) + '\r');
                        console.log(kleur.green('✔ Phase 1 Complete (Concurrency Active)'));
                        renderAuditSummary(statusData.result, true);
                        console.log(kleur.cyan('Waiting for Phase 2 (Lighthouse) to finish...'));
                        showedPartial = true;
                    }

                    if (!showedPartial) {
                        process.stdout.write(kleur.yellow(`\rStatus: ${statusData.status}...   `));
                    } else {
                        const elapsed = Math.round((Date.now() - startTime) / 1000);
                        process.stdout.write(kleur.dim(`\rLighthouse running... (${elapsed}s elapsed) `));
                    }

                    await new Promise(r => setTimeout(r, 2000));
                }

                if (finalData) {
                    const totalSeconds = Math.round((Date.now() - startTime) / 1000);
                    console.log('\n');
                    renderAuditSummary(finalData, false);
                    console.log(kleur.dim(`Total Audit Time: ${totalSeconds} seconds`));

                    // Show Suggestions
                    renderSuggestions(finalData.suggestions);

                    // Optional JSON Display
                    const showJson = await confirm({
                        message: 'Would you like to see the raw JSON response body?',
                        default: false
                    });

                    if (showJson) {
                        console.log(kleur.gray('\n' + '─'.repeat(30) + ' RAW JSON START ' + '─'.repeat(30)));
                        console.log(JSON.stringify(finalData, null, 2));
                        console.log(kleur.gray('─'.repeat(30) + '  RAW JSON END  ' + '─'.repeat(30) + '\n'));
                    }
                }
            }

            console.log('\n');
            keepRunning = await confirm({ message: 'Audit another URL?', default: true });

        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.log(kleur.red('\n✖ Error: Connection Refused. Ensure "npm run dev" is active.'));
            } else {
                console.log(kleur.red(`\n✖ Script Error: ${error.message}`));
            }
            keepRunning = await confirm({ message: 'Try again?', default: true });
        }
    }
    process.exit(0);
}

main();