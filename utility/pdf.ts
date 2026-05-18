
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function generatePDF(
  metrics: any,
  charts: { bar: string; pie: string },
  screenshots: { name: string; base64: string }[],
  logs: string
) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const screenshotHtml = screenshots.map(s => `
    <div>
      <p>${s.name}</p>
      <img src="data:image/png;base64,${s.base64}" style="max-width:500px"/>
    </div>
  `).join('');

 /* ================= PER USER TABLE ================= */
  const userSection = metrics.users?.length
    ? `
    <h3>Per User Metrics</h3>
    <table border="1" cellpadding="6" cellspacing="0" width="100%">
      <tr>
        <th>User</th>
        <th>Requests</th>
        <th>Avg Time (ms)</th>
        <th>Errors</th>
        <th>Timeouts</th>
      </tr>

      ${metrics.users.map((u: any, i: number) => `
        <tr>
          <td>User ${i + 1}</td>
          <td>${u.requests ?? 0}</td>
          <td>${u.avg?.toFixed(2) ?? 0}</td>
          <td>${u.errors ?? 0}</td>
          <td>${u.timeouts ?? 0}</td>
        </tr>
      `).join('')}
    </table>
    `
    : '';

const barChartHtml = charts.bar
  ? `
  <h2>Latency Distribution</h2>
  <img src="${charts.bar}" width="100%"/>
  `
  : '';

const pieChartHtml = charts.pie
  ? `
  <h2>Success vs Failure</h2>
  <img src="${charts.pie}" width="60%"/>
  `
  : '';

const html = `
<html>
<head>
<style>
  body {
    font-family: 'Segoe UI', Arial;
    padding: 30px;
    color: #333;
  }

  h1 {
    text-align: center;
    color: #1f4e79;
    margin-bottom: 5px;
  }

  h2 {
    border-bottom: 2px solid #1f4e79;
    padding-bottom: 5px;
    margin-top: 30px;
  }

  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
    background: #fafafa;
  }

  .kpi {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }

  .kpi div {
    flex: 1;
    margin: 5px;
    padding: 10px;
    border-radius: 6px;
    text-align: center;
    background: #eef4fb;
    font-weight: bold;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
  }

  th {
    background: #1f4e79;
    color: white;
    padding: 8px;
    text-align: left;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #ddd;
  }

  tr:nth-child(even) {
    background: #f5f5f5;
  }

  img {
    margin-top: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  .footer {
    margin-top: 40px;
    font-size: 12px;
    text-align: center;
    color: #777;
  }
</style>
</head>

<body>

<h1>Performance Test Report</h1>
<p style="text-align:center;">Generated via Playwright Framework</p>

<h2>Project Overview</h2>
<div class="card">
  <p><b>Project:</b> Ilife</p>
  <p><b>Test Type:</b> Concurrent User Workflow Test</p>
  <p><b>Tool:</b> Playwright</p>
  <p><b>Users:</b> 5 | Ramp-up: 3 sec/user</p>
</div>

<h2>Objective</h2>
<div class="card">
  Validate system performance under concurrent user load executing complete workflow including login,
  authorization creation, and timesheet submission.
</div>

<h2>Workflow</h2>
<div class="card">
  <ol>
    <li>Login</li>
    <li>Navigate to Client List</li>
    <li>Select Client</li>
    <li>Open Authorization Tab</li>
    <li>Create Authorization</li>
    <li>Fill Details</li>
    <li>Save Authorization</li>
    <li>Navigate to Timesheet</li>
    <li>Create & Save Timesheet</li>
    <li>Logout</li>
  </ol>
</div>


<h2>Detailed Metrics</h2>
<table>
<tr><th>Metric</th><th>Value</th></tr>
<tr><td>Total Requests</td><td>${metrics.totalRequests ?? 0}</td></tr>
<tr><td>Average Response Time</td><td>${metrics.avg?.toFixed(2) ?? 0} ms</td></tr>
<tr><td>Median</td><td>${metrics.median ?? 0} ms</td></tr>
<tr><td>P90</td><td>${metrics.p90 ?? 0} ms</td></tr>
<tr><td>P95</td><td>${metrics.p95 ?? 0} ms</td></tr>
<tr><td>P99</td><td>${metrics.p99 ?? 0} ms</td></tr>
<tr><td>Error Rate</td><td>${metrics.errorRate?.toFixed(2) ?? 0}%</td></tr>
<tr><td>Throughput (RPS)</td><td>${metrics.rps?.toFixed(2) ?? 0}</td></tr>
</table>

${userSection}

${barChartHtml}

${pieChartHtml}

<h2>Conclusion</h2>
<div class="card">
  System performance under concurrent load is 
  <b>${metrics.errorRate > 5 ? 'UNSTABLE' : 'STABLE'}</b>.
  <br><br>
</div>

<div class="footer">
  Generated on ${new Date().toLocaleString()}
</div>

</body>
</html>
`;

  const filePath = path.resolve('playwright-report/summary.pdf');

  await page.setViewportSize({
  width: 1400,
  height: 2000
});

  await page.setContent(html);
  await page.waitForLoadState('networkidle');
  await page.pdf({ path: filePath, format: 'A4', printBackground: true });

  await browser.close();
  return filePath;
}

export async function generateSummaryPDF() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('file://' + process.cwd() + '/utility/summary.html');

  await page.pdf({
    path: 'playwright-report/summary.pdf',
    format: 'A4',
    printBackground: true
  });

  await browser.close();

  console.log('✅ Summary PDF generated');
}