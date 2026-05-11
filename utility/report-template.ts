export function buildFullReport(
  metrics: any,
  chartBase64: string,
  screenshots: { name: string; base64: string }[],
  logs: string
) {
  const screenshotHtml = screenshots.map(s => `
    <div>
      <p>${s.name}</p>
      <img src="data:image/png;base64,${s.base64}" style="max-width:600px"/>
    </div>
  `).join('');

  return `
  <html>
  <body style="font-family:Arial;padding:20px">

  <h1 style="text-align:center;"> Performance Test Report</h1>

  <h3>Project Info</h3>
  <ul>
    <li>Project: Ilife</li>
    <li>Users: 30</li>
  </ul>

  <h3>Metrics</h3>
  <table border="1" cellpadding="6">
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Avg</td><td>${metrics.avg.toFixed(2)} ms</td></tr>
    <tr><td>Median</td><td>${metrics.median}</td></tr>
    <tr><td>P90</td><td>${metrics.p90}</td></tr>
    <tr><td>P95</td><td>${metrics.p95}</td></tr>
    <tr><td>P99</td><td>${metrics.p99}</td></tr>
    <tr><td>Error Rate</td><td>${metrics.errorRate.toFixed(2)}%</td></tr>
    <tr><td>RPS</td><td>${metrics.rps.toFixed(2)}</td></tr>
  </table>

  <h3>Chart</h3>
  <img src="data:image/png;base64,${chartBase64}" />

  <h3>Screenshots</h3>
  ${screenshotHtml}

  <h3>Logs</h3>
  <pre>${logs.slice(0,2000)}</pre>

  </body>
  </html>
  `;
}