import fs from 'fs';
import path from 'path';
import { calculate, getData } from './metrices';
import { sendMail } from './mail';
import { cleanFolders } from './cleanup';
import { execSync } from 'child_process';



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
  const reportDir = path.resolve('playwright-report');
  const shard = process.env.SHARD || 'local';

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }


  // ✅ Save JSON report
  fs.writeFileSync(
    `playwright-report/metrics-${shard}.json`,
    JSON.stringify(result, null, 2)
  );
  //await sendMail(result);

  cleanFolders();

  // ✅ Clean temp file (optional)
  if (fs.existsSync('metrics-temp.json')) {
    fs.unlinkSync('metrics-temp.json');
  }
}
