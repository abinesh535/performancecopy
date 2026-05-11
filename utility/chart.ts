import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';
import path from 'path';

export async function generateChart(metrics: any) {
  const width = 600;
  const height = 300;

  const canvas = new ChartJSNodeCanvas({ width, height });

  // ✅ BAR CHART (Latency)
  const barConfig = {
    type: 'bar' as const,
    data: {
      labels: ['Median', 'P90', 'P95', 'P99'],
      datasets: [
        {
          label: 'Latency (ms)',
          data: [
            metrics.median ?? 0,
            metrics.p90 ?? 0,
            metrics.p95 ?? 0,
            metrics.p99 ?? 0,
          ],
        },
      ],
    },
  };



  const barBuffer = await canvas.renderToBuffer(barConfig);

  // ✅ PIE CHART (Pass/Fail)
const pass = metrics.totalRequests
  ? (metrics.successRate / 100) * metrics.totalRequests
  : 0;

const fail = metrics.totalRequests
  ? (metrics.errorRate / 100) * metrics.totalRequests
  : 0;

  
  console.log(metrics.successRate, metrics.errorRate);
  
const total = pass + fail;
  const chartData =
  total === 0 ? [1, 1] : [pass, fail];

  const pieConfig = {
    type: 'pie' as const,
    data: {
      labels:  [
      `Passed (${total ? ((pass / total) * 100).toFixed(1) : 0}%)`,
      `Failed (${total ? ((fail / total) * 100).toFixed(1) : 0}%)`
    ],
      datasets: [
        {
          data: chartData,
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      animation: {
  duration: 0
},
      plugins: {
        legend: { position: 'bottom' as const },
      },
    },
  };

  const pieBuffer = await canvas.renderToBuffer(pieConfig);

  // ✅ Save files
  const reportDir = path.resolve('playwright-report');
  fs.mkdirSync(reportDir, { recursive: true });

  const barPath = path.join(reportDir, 'latency-chart.png');
  const piePath = path.join(reportDir, 'pass-fail-chart.png');

  fs.writeFileSync(barPath, barBuffer);
  fs.writeFileSync(piePath, pieBuffer);

  return { barPath, piePath };
}