import fs from 'fs';

const FILE = 'metrics-temp.json';

/* ================= TYPES ================= */

type UserMetrics = {
  requests: number;
  times: number[];
  errors: number;
  timeouts: number;
};

type MetricsData = {
  requests: number;
  times: number[];
  errors: number;
  timeouts: number;
  users: Record<number, UserMetrics>;
};

/* ================= FILE WRITE ================= */

function append(entry: any) {
  fs.appendFileSync(FILE, JSON.stringify(entry) + '\n');
}

/* ================= RECORD FUNCTIONS ================= */
export function recordRequest( userId: number) {
  append({ type: 'request',userId });
}


export function recordTime(ms: number, userId: number) {
  append({ type: 'time', value: ms, userId });
}

export function recordError(userId: number) {
  append({ type: 'error', userId });
}

export function recordTimeout(userId: number) {
  append({ type: 'timeout', userId });
}

/* ================= READ + BUILD DATA ================= */

export function getData(): MetricsData {
  if (!fs.existsSync(FILE)) {
    return {requests: 0, times: [], errors: 0, timeouts: 0, users: {} };
  }

  const lines = fs.readFileSync(FILE, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);

  const data: MetricsData = {
    requests: 0,
    times: [],
    errors: 0,
    timeouts: 0,
    users: {},
  };

  for (const line of lines) {
    const entry = JSON.parse(line);
    const userId = entry.userId ?? 0;

    // Ensure user exists
    if (!data.users[userId]) {
      data.users[userId] = {
        times: [],
        errors: 0,
        timeouts: 0,
        requests: 0,
      };
    }

     if (entry.type === 'request') {
  data.requests++;
  data.users[userId].requests++;
}

    if (entry.type === 'time') {
      data.times.push(entry.value);
      data.users[userId].times.push(entry.value);
    }

    if (entry.type === 'error') {
      data.errors++;
      data.users[userId].errors++;
    }

    if (entry.type === 'timeout') {
      data.timeouts++;
      data.users[userId].timeouts++;

      // ALSO mark failure
  data.errors++;
  data.users[userId].errors++;
    }
  }

  return data;
}

/* ================= CALCULATE METRICS ================= */

export async function calculate(data: MetricsData) {
  const times = data.times;
  const sorted = [...times].sort((a, b) => a - b);

  // ✅ FIXED total requests
  const totalRequests = data.requests;

  const avg = times.length
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;

  const median = sorted.length
    ? sorted[Math.floor(sorted.length / 2)]
    : 0;

  // ✅ Safe percentile calculation
  const getPercentile = (p: number) =>
    sorted.length
      ? sorted[Math.min(Math.floor(sorted.length * p), sorted.length - 1)]
      : 0;

  const p90 = getPercentile(0.9);
  const p95 = getPercentile(0.95);
  const p99 = getPercentile(0.99);

  // ✅ Better RPS (based on total time)
  const totalTimeSec = times.length
    ? Math.max(...times) / 1000
    : 1;

  const rps = totalRequests / totalTimeSec;

  const errorRate = totalRequests
    ? (data.errors / totalRequests) * 100
    : 0;

  const successRate = totalRequests
    ? ((totalRequests - data.errors) / totalRequests) * 100
    : 0;

  /* ================= PER USER METRICS ================= */

  const users = Object.entries(data.users).map(([userId, u]) => {
    const userRequests = u.requests;

    const userAvg = u.times.length
      ? u.times.reduce((a, b) => a + b, 0) / u.times.length
      : 0;

    return {
      userId: Number(userId),
      requests: userRequests,
      avg: userAvg,
      errors: u.errors,
      timeouts: u.timeouts,
    };
  });

  /* ================= FINAL OUTPUT ================= */

  return {
    totalRequests,
    avg,
    median,
    p90,
    p95,
    p99,
    errorRate,
    successRate,
    timeouts: data.timeouts,
    rps,
    users, // ✅ per-user included
  };
}