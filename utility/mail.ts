import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateChart } from './chart';
import { generatePDF } from './pdf';
import archiver from 'archiver';
import { buildFullReport } from './report-template';

if (!process.env.GITHUB_ACTIONS) {
  dotenv.config({ path: '.env.config' });
}

const logFilePath = path.resolve('terminal.log');

/* ================= LOG CLEANING ================= */
function extractImportantLogs(rawLog: string): string {
  let cleaned = rawLog.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');

  cleaned = cleaned
    .split('\n')
    .filter(line => !line.includes('[dotenv@'))
    .join('\n');

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/* ================= SCREENSHOT COLLECTOR ================= */
function collectArtifacts(dir: string, attachments: any[] = []) {
  if (!fs.existsSync(dir)) return attachments;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);

    if (fs.statSync(fullPath).isDirectory()) {
      collectArtifacts(fullPath, attachments);
    } else if (item.endsWith('.png')) {
      attachments.push({
        filename: item,
        path: fullPath,
        cid: item, // 👈 IMPORTANT for embedding in email
      });
    }
  }

  return attachments;
}

/* ================= BUILD USER METRICS ================= */
function buildUserSection(metrics: any) {
  if (!metrics.users || metrics.users.length === 0) return '';

  let section = `\n👤 PER USER METRICS\n-------------------------\n`;

  metrics.users.forEach((u: any, i: number) => {
    section += `
User ${i + 1}:
  Requests : ${u.requests}
  Avg Time : ${u.avg.toFixed(2)} ms
  Errors   : ${u.errors}
  Timeouts : ${u.timeouts}
---------------------------`;
  });

  return section;
}

/* ================= REPORT BUILDER ================= */
function buildReport(metrics: any, finalLog: string) {
  const userSection = buildUserSection(metrics);

  return `
📊 ===== PLAYWRIGHT EXECUTION REPORT =====

📌 METRICS SUMMARY
-------------------------
Total Requests: ${metrics.totalRequests ?? 0}
Avg Time      : ${metrics.avg?.toFixed(2) ?? 0} ms
Median        : ${metrics.median ?? 0} ms
P90           : ${metrics.p90 ?? 0} ms
P95           : ${metrics.p95 ?? 0} ms
P99           : ${metrics.p99 ?? 0} ms
Errors        : ${metrics.errors ?? 0}
Timeouts      : ${metrics.timeouts ?? 0}
Error Rate    : ${metrics.errorRate?.toFixed(2) ?? 0} %
RPS           : ${metrics.rps?.toFixed(2) ?? 0}

${userSection}
========================================
`;
}

/* ================= BUILD INLINE SCREENSHOT HTML ================= */
function buildScreenshotHtml(attachments: any[]) {
  if (!attachments.length) {
    return '<p>No screenshots captured</p>';
  }

  return attachments.map(att => `
    <div style="margin-bottom:20px;">
      <p><b>${att.filename}</b></p>
      <img src="cid:${att.cid}" style="max-width:600px;border:1px solid #ccc;border-radius:6px;" />
    </div>
  `).join('');
}
/*=======zip======*/
async function zipReport(pdfPath: string): Promise<string | null> {
  const reportDir = path.resolve('playwright-report');
  const zipPath = path.resolve('playwright-report.zip');
  const indexPath = path.join(reportDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found');
    return null;
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // ✅ Add ONLY index.html
    archive.file(indexPath, { name: 'index.html' });

    // ✅ Add ONLY summary.pdf
    if (fs.existsSync(pdfPath)) {
      archive.file(pdfPath, { name: 'summary.pdf' });
    }
     const screenshotDir = path.resolve('screenshots');
     if (fs.existsSync(screenshotDir)) {
      archive.directory(screenshotDir, 'screenshots');
    }

    archive.finalize();

    output.on('close', () => resolve(zipPath));
    archive.on('error', err => reject(err));
  });
}


/* ================= MAIN MAIL FUNCTION ================= */
export async function sendMail(metrics?: any) {

  // logs
  const rawLog = fs.existsSync('terminal.log')
    ? fs.readFileSync('terminal.log', 'utf-8')
    : '';

  // chart
let barPath = '';
let piePath = '';

if (metrics) {
  const charts = await generateChart(metrics);
  barPath = charts.barPath;
  piePath = charts.piePath;
}
// const barBase64 = fs.readFileSync(barPath, 'base64');
// const pieBase64 = fs.readFileSync(piePath, 'base64');

let barChart = '';
let pieChart = '';

if (barPath && fs.existsSync(barPath)) {
  barChart = fs.readFileSync(barPath).toString('base64');
}

if (piePath && fs.existsSync(piePath)) {
  pieChart = fs.readFileSync(piePath).toString('base64');
}

  // screenshots
  const screenshotDir = path.resolve('screenshots');
  const screenshots = fs.existsSync(screenshotDir)
    ? fs.readdirSync(screenshotDir).map(file => ({
        name: file,
        base64: fs.readFileSync(path.join(screenshotDir, file), 'base64'),
      }))
    : [];

  // PDF
  const pdfPath = await generatePDF(
    metrics,
    { bar: barChart, pie: pieChart },
    screenshots,
    rawLog
  );
   await new Promise(res => setTimeout(res, 3000));
  // ZIP playwright report
  const zipPath = await zipReport(pdfPath);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: [
  'agrant@kanrad.com'
  // 'rsimmons@kanrad.com'
].join(','),
    subject: '📊 Test Execution Report',

    html: `
      <h2>Report</h2>
      <p>Please find attached reports:</p>
      <ul>
        <li>PDF Summary Report</li>
        <li>Playwright HTML Report (ZIP)</li>
      </ul>
    `,

    attachments: [
      ...(zipPath
        ? [
            {
              filename: 'playwright-report.zip',
              path: 'playwright-report.zip',
            },
          ]
        : []),
    ],
  });

  console.log('✅ Mail sent');

}

