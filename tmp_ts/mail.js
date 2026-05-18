"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const chart_1 = require("./chart");
const pdf_1 = require("./pdf");
const archiver_1 = __importDefault(require("archiver"));
dotenv_1.default.config({ path: '.env.config' });
const logFilePath = path_1.default.resolve('terminal.log');
/* ================= LOG CLEANING ================= */
function extractImportantLogs(rawLog) {
    let cleaned = rawLog.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
    cleaned = cleaned
        .split('\n')
        .filter(line => !line.includes('[dotenv@'))
        .join('\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
}
/* ================= SCREENSHOT COLLECTOR ================= */
function collectArtifacts(dir, attachments = []) {
    if (!fs_1.default.existsSync(dir))
        return attachments;
    for (const item of fs_1.default.readdirSync(dir)) {
        const fullPath = path_1.default.join(dir, item);
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            collectArtifacts(fullPath, attachments);
        }
        else if (item.endsWith('.png')) {
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
function buildUserSection(metrics) {
    if (!metrics.users || metrics.users.length === 0)
        return '';
    let section = `\n👤 PER USER METRICS\n-------------------------\n`;
    metrics.users.forEach((u, i) => {
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
function buildReport(metrics, finalLog) {
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
function buildScreenshotHtml(attachments) {
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
async function zipReport(pdfPath) {
    const reportDir = path_1.default.resolve('playwright-report');
    const zipPath = path_1.default.resolve('playwright-report.zip');
    const indexPath = path_1.default.join(reportDir, 'index.html');
    if (!fs_1.default.existsSync(indexPath)) {
        console.log('❌ index.html not found');
        return null;
    }
    return new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        // ✅ Add ONLY index.html
        archive.file(indexPath, { name: 'index.html' });
        // ✅ Add ONLY summary.pdf
        if (fs_1.default.existsSync(pdfPath)) {
            archive.file(pdfPath, { name: 'summary.pdf' });
        }
        const screenshotDir = path_1.default.resolve('screenshots');
        if (fs_1.default.existsSync(screenshotDir)) {
            archive.directory(screenshotDir, 'screenshots');
        }
        archive.finalize();
        output.on('close', () => resolve(zipPath));
        archive.on('error', err => reject(err));
    });
}
/* ================= MAIN MAIL FUNCTION ================= */
async function sendMail(metrics) {
    // logs
    const rawLog = fs_1.default.existsSync('terminal.log')
        ? fs_1.default.readFileSync('terminal.log', 'utf-8')
        : '';
    // chart
    let barPath = '';
    let piePath = '';
    if (metrics) {
        const charts = await (0, chart_1.generateChart)(metrics);
        barPath = charts.barPath;
        piePath = charts.piePath;
    }
    // const barBase64 = fs.readFileSync(barPath, 'base64');
    // const pieBase64 = fs.readFileSync(piePath, 'base64');
    let barChart = '';
    let pieChart = '';
    if (barPath && fs_1.default.existsSync(barPath)) {
        barChart = fs_1.default.readFileSync(barPath).toString('base64');
    }
    if (piePath && fs_1.default.existsSync(piePath)) {
        pieChart = fs_1.default.readFileSync(piePath).toString('base64');
    }
    // screenshots
    const screenshotDir = path_1.default.resolve('screenshots');
    const screenshots = fs_1.default.existsSync(screenshotDir)
        ? fs_1.default.readdirSync(screenshotDir).map(file => ({
            name: file,
            base64: fs_1.default.readFileSync(path_1.default.join(screenshotDir, file), 'base64'),
        }))
        : [];
    // PDF
    let pdfPath = '';
    if (metrics) {
        pdfPath = await (0, pdf_1.generatePDF)(metrics, { bar: barChart, pie: pieChart }, screenshots, rawLog);
    }
    ;
    await new Promise(res => setTimeout(res, 3000));
    // ZIP playwright report
    const zipPath = await zipReport(pdfPath);
    const mailUser = process.env.MAIL_USER?.trim();
    const mailPass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s+/g, '') : undefined;
    const mailTo = process.env.MAIL_TO || 'agrant@kanrad.com';
    if (!mailUser || !mailPass) {
        throw new Error('MAIL_USER and MAIL_PASS must be set for email sending');
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: mailUser,
            pass: mailPass,
        },
        logger: true,
        debug: true,
    });
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
    }
    catch (verifyError) {
        console.error('❌ SMTP verification failed:', verifyError);
        throw verifyError;
    }
    const mailOptions = {
        from: mailUser,
        to: mailTo,
        subject: '📊 Test Execution Report',
        html: `
      <h2>Report</h2>
      <p>Please find attached reports:</p>
      <ul>
        <li>PDF Summary Report</li>
        <li>Playwright HTML Report (ZIP)</li>
      </ul>
    `,
        attachments: zipPath
            ? [
                {
                    filename: 'playwright-report.zip',
                    path: zipPath,
                },
            ]
            : [],
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Mail sent:', info.messageId);
    }
    catch (sendError) {
        console.error('❌ Failed to send email:', sendError);
        throw sendError;
    }
}
