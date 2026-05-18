import fs from 'fs';
import path from 'path';
import { calculate, getData } from './metrices';
import { sendMail } from './mail';
import { cleanFolders } from './cleanup';
import { execSync } from 'child_process';



async function waitForReportHtml(reportDir: string, timeoutMs = 10000) {
  const indexPath = path.join(reportDir, 'index.html');
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(indexPath)) {
      const stat = fs.statSync(indexPath);
      if (stat.size > 0) {
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.warn('⚠️ waiting for playwright-report/index.html to become available');
}

const ROOT = path.resolve(__dirname, '..');

export default async function globalTeardown() {
  const data = getData();
  const result = await calculate(data);

  console.log('\n📊 ===== FINAL METRICS =====');
  console.log(`Total Requests : ${result.totalRequests}`);
  console.log(`Avg Time       : ${result.avg.toFixed(2)} ms`);
  console.log(`Median         : ${result.median} ms`);
  console.log(`P90            : ${result.p90} ms`);
  console.log(`P95            : ${result.p95} ms`);
  console.log(`P99            : ${result.p99} ms`);
  console.log(`Error Rate     : ${result.errorRate.toFixed(2)} %`);
  console.log(`Timeouts       : ${result.timeouts}`);
  console.log(`RPS            : ${result.rps.toFixed(2)}`);
  console.log('==============================\n');

   // ✅ Ensure folder exists
  const reportDir = path.join(ROOT, 'playwright-report');
  const shard = process.env.SHARD || 'local';

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  await waitForReportHtml(reportDir, 15000);

  // ✅ Save JSON report
  fs.writeFileSync(
    path.join(reportDir, `metrics-${shard}.json`),
    JSON.stringify(result, null, 2)
  );

  console.log('ℹ️ Report data saved. Email will be sent by the Playwright reporter.');

  //cleanFolders();

  // ✅ Clean temp file (optional)
//   if (fs.existsSync('metrics-temp.json')) {
//     fs.unlinkSync('metrics-temp.json');
//   }
 }
