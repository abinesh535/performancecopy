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
const archiver_1 = __importDefault(require("archiver"));
dotenv_1.default.config({ path: '.env.config' });
/* ================= ZIP REPORT ================= */
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
        archive.file(indexPath, { name: 'index.html' });
        if (pdfPath && fs_1.default.existsSync(pdfPath)) {
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
/* ================= SEND MAIL FUNCTION ================= */
async function sendMail(metrics) {
    const mailUser = process.env.MAIL_USER?.trim();
    const mailPass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s+/g, '') : undefined;
    const mailTo = process.env.MAIL_TO || 'agrant@kanrad.com';
    if (!mailUser || !mailPass) {
        throw new Error('MAIL_USER and MAIL_PASS must be set for email sending');
    }
    // Create zip of playwright report
    const zipPath = await zipReport(null);
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: mailUser,
            pass: mailPass,
        },
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
      <h2>Test Execution Report</h2>
      <p>Please find attached the Playwright test report.</p>
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
/* ================= MAIN ENTRY POINT ================= */
async function main() {
    try {
        await sendMail();
    }
    catch (error) {
        console.error('Error sending mail:', error);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
