import fs from 'fs';
import path from 'path';

const metricsDir = 'all-metrics';
const outputFile = 'metrics-temp.json';

const merged = {
  totalRequests: 0,
  times: [] as number[],
  errors: 0,
  timeouts: 0,
  users: [] as any[],
};

if (!fs.existsSync(metricsDir)) {
  fs.mkdirSync(metricsDir, { recursive: true });

  console.log(`⚠️ Created missing folder: ${metricsDir}`);
}

function walk(dir: string) {

  const files = fs.readdirSync(dir);

  for (const file of files) {

    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {

      walk(full);

    } else if (/^metrics-.*\.json$/.test(file)) {

      console.log(`📄 Reading: ${full}`);

      const data =
        JSON.parse(fs.readFileSync(full, 'utf-8'));

      merged.totalRequests +=
        data.totalRequests || 0;

      merged.errors +=
        data.errors || 0;

      merged.timeouts +=
        data.timeouts || 0;

      if (Array.isArray(data.times)) {

        merged.times.push(...data.times);
      }

      if (Array.isArray(data.users)) {

        merged.users.push(...data.users);
      }
    }
  }
}

walk(metricsDir);

/* ================= CALCULATIONS ================= */

merged.times.sort((a, b) => a - b);

const avg =
  merged.times.length
    ? merged.times.reduce((a, b) => a + b, 0)
      / merged.times.length
    : 0;

function percentile(arr: number[], p: number) {

  if (!arr.length) return 0;

  const index =
    Math.ceil((p / 100) * arr.length) - 1;

  return arr[index];
}

const finalMetrics = {

  totalRequests: merged.totalRequests,

  avg,

  median: percentile(merged.times, 50),

  p90: percentile(merged.times, 90),

  p95: percentile(merged.times, 95),

  p99: percentile(merged.times, 99),

  errors: merged.errors,

  timeouts: merged.timeouts,

  errorRate:
    merged.totalRequests
      ? (merged.errors / merged.totalRequests) * 100
      : 0,

  users: merged.users,
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(finalMetrics, null, 2)
);

console.log('✅ Metrics merged successfully');