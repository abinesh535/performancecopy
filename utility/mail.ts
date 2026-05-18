import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import archiver from 'archiver';
import { generateChart } from './chart';
import { generatePDF } from './pdf';

dotenv.config({ path: '.env.config' });

const ROOT = path.resolve(__dirname, '..');

/* ================= ZIP REPORT ================= */
async function zipReport(pdfPath: string | null): Promise<string | null> {
  const reportDir = path.join(ROOT, 'playwright-report');
  const zipPath = path.join(ROOT, 'playwright-report.zip');
  const indexPath = path.join(reportDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found at', indexPath);
    return null;
  }

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', err => reject(err));
    output.on('close', () => {
      console.log(`✅ Created zip: ${zipPath}`);
      resolve(zipPath);
    });

    archive.pipe(output);
    archive.directory(reportDir, false, entry => {
      const name = entry.name || '';
      if (
        name.endsWith('latency-chart.png') ||
        name.endsWith('pass-fail-chart.png') ||
        /^metrics-.*\.json$/.test(name) ||
        name.endsWith('summary.pdf')
      ) {
        return false;
      }
      return entry;
    });

    if (pdfPath && fs.existsSync(pdfPath)) {
      archive.file(pdfPath, { name: 'summary.pdf' });
    }

    const screenshotDir = path.resolve('screenshots');
    if (fs.existsSync(screenshotDir)) {
      archive.directory(screenshotDir, 'screenshots');
    }

    archive.finalize();
  });
}

/* ================= SEND MAIL FUNCTION ================= */
export async function sendMail(metrics?: any) {
  const mailUser = process.env.MAIL_USER?.trim();
  const mailPass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s+/g, '') : undefined;
  const mailTo = process.env.MAIL_TO || 'agrant@kanrad.com';

  const githubRunUrl =
  `${process.env.GITHUB_SERVER_URL}/` +
  `${process.env.GITHUB_REPOSITORY}/actions/runs/` +
  `${process.env.GITHUB_RUN_ID}`;

  if (!mailUser || !mailPass) {
    throw new Error('MAIL_USER and MAIL_PASS must be set for email sending');
  }

  let pdfPath: string | null = null;

  if (metrics) {
    try {
      const charts = await generateChart(metrics);
      pdfPath = await generatePDF(metrics, charts, [], '');
    } catch (pdfError) {
      console.warn('⚠️ PDF generation failed, continuing without PDF:', pdfError);
    }
  }

  if (!pdfPath) {
    const fallbackPdf = path.join(ROOT, 'playwright-report', 'summary.pdf');
    if (fs.existsSync(fallbackPdf)) {
      pdfPath = fallbackPdf;
    }
  }

  // Create zip of playwright report
  const zipPath = await zipReport(pdfPath);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
  } catch (verifyError) {
    console.error('❌ SMTP verification failed:', verifyError);
    throw verifyError;
  }

  const attachments = [] as Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;

  if (zipPath && fs.existsSync(zipPath)) {
    console.log(`📎 Attaching zip: ${zipPath}`);
    attachments.push({
      filename: 'playwright-report.zip',
      path: zipPath,
      contentType: 'application/zip',
    });
  } else {
    console.warn('⚠️ Zip report not found, attachment will be skipped');
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

       <p>
    Full execution artifacts including videos,
    traces, and detailed reports can be accessed here:
  </p>

  <a href="${githubRunUrl}">
    Open GitHub Actions Run
  </a>
    `,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mail sent:', info.messageId);
  } catch (sendError) {
    console.error('❌ Failed to send email:', sendError);
    throw sendError;
  }
}

/* ================= MAIN ENTRY POINT ================= */
async function main() {
  try {
    await sendMail();
    console.log('✅ Report email sent successfully');
  } catch (error) {
    console.error('Error sending mail:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (
  require.main === module &&
  process.env.GITHUB_JOB !== 'playwright-tests'
) {
  main();
}

