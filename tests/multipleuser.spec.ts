import fs from 'fs';
import path from 'path';
import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { retryStep } from '../utility/retry';
import { runTimesheetFlow } from '../pages/timesheet';
import { captureFailure } from '../utility/screenshot';

const screenshotDir = path.resolve('screenshots');
if (fs.existsSync(screenshotDir)) {
  fs.rmSync(screenshotDir, { recursive: true, force: true });
  console.log('🧹 Cleared stale screenshots before test run');
}

const usedAuthNumbers = new Set<string>();

const reportDir = path.resolve('playwright-report');
if (fs.existsSync(reportDir)) {
  fs.rmSync(reportDir, { recursive: true, force: true });
  console.log('🧹 Cleared stale playwright-report before test run');
}

import {
  recordRequest,
  recordTime as fileRecordTime,
  recordError as fileRecordError,
  recordTimeout as fileRecordTimeout,
  resetMetrics
} from '../utility/metrices';

// reset stale metrics from previous runs
resetMetrics();

// 📊 Global Metrics
// 📊 Global Metrics
let times: number[] = [];
let errors = 0;
let timeouts = 0;

// 👤 Per-user metrics
const userMetrics: Record<number, {
  requests: number;
  duration: number;
  success: boolean;
  errors: number;
  timeouts: number;
}> = {};

// ✅ Track all durations (success + failure)
function recordTime(t: number) {
  times.push(t);
}

function recordError() {
  errors++;
}

function recordTimeout() {
  timeouts++;
}

function printReport() {
  const totalRequests = users.length;

  const avg =
    times.length
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

  const errorRate =
    totalRequests
      ? ((errors / totalRequests) * 100).toFixed(2)
      : '0';

  console.log('\n📊 TEST REPORT');
  console.log('Total Requests:', totalRequests);
  console.log('Average Time:', avg.toFixed(2), 'ms');
  console.log('Errors:', errors);
  console.log('Timeouts:', timeouts);
  console.log('Error Rate:', `${errorRate}%`);
}

// ⏱ delay helper
function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

// 👤 Users
// const users = [
//   { username: '011pet@1245.org', password: 'Test@1234' },
//   { username: '011pet@1245.org', password: 'Test@1234' },
//   { username: '011pet@1245.org', password: 'Test@1234' },
//   { username: '011pet@1245.org', password: 'Test@1234' },
//   { username: '011pet@1245.org', password: 'Test@1234' },
//    { username: '011pet@1245.org', password: 'Test@1234' },
//    { username: '011pet@1245.org', password: 'Test@1234' },
//    { username: '011pet@1245.org', password: 'Test@1234' },
//    { username: '011pet@1245.org', password: 'Test@1234' },
//    { username: '011pet@1245.org', password: 'Test@1234' },
  
// ];

const users = Array.from({ length: 4}, (_, i) => ({
  username: `011pet@1245.org`,
  password: 'Test@1234'
}));


users.forEach((user, i) => {
  test(`User ${i + 1}`, async ({ page }) => {
    // test logic
  });
});

test('concurrent login with metrics', async ({ browser }) => {
  test.setTimeout(3 * 60 * 1000);

  const contexts = await Promise.all(
    users.map(() => browser.newContext())
  );

  const pages = await Promise.all(
  contexts.map(async (c) => {
    const p = await c.newPage();
    p.setDefaultTimeout(30000);
    return p;
  })
);
 await Promise.all(
  pages.map(async (page, i) => {

    // 👤 init user metrics
    if (!userMetrics[i]) {
      userMetrics[i] = {
        requests: 1,
        duration: 0,
        success: false,
        errors: 0,
        timeouts: 0
      };
    }

    await delay(i * 3000);

    const start = Date.now();

    // ✅ 1 user = 1 request
    recordRequest(i);

    // ✅ success tracker
    let success = false;

    try {

      const response = await page.goto(
        'https://staging.kantimehealth.net/identity/v2/Accounts/Authorize'
      );

      if (!response || !response.ok()) {
        recordError();
        fileRecordError(i);
        userMetrics[i].errors++;
      }

      // 🔐 Login
      await page.getByPlaceholder('User Name').fill(users[i].username);
      await page.getByRole('textbox', { name: 'Password' }).fill(users[i].password);
      await page.getByRole('button', { name: 'Login' }).click();

      await page.locator(`//*[@id="2"]`).click();
      await page.getByText('Client List - IRIS').click();

      await page.locator("body > main:nth-child(1) > main:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)").click();

      await page.getByText('Auth', { exact: true }).click();

      await page.locator("(//*[name()='svg'][@class='lucide lucide-ellipsis-vertical w-5 h-5'])[1]").click();

      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.getByText('Create Manual Authorization', { exact: true }).click()
      ]);

      await popup.bringToFront();

      let authNumber = '';

      do {
        authNumber = `autha${faker.number.int({ min: 9000, max: 9999 })}`;
      } while (usedAuthNumbers.has(authNumber));

      usedAuthNumbers.add(authNumber);

      await popup.locator('#authorization_number').fill(authNumber);

      await retryStep(popup, 'Select Vendor checkbox', async () => {
        await popup.locator("//span[normalize-space()='Vendor']/ancestor::label//button[@role='checkbox']").click();
      });

      await retryStep(popup, 'Search Vendor', async () => {
        await popup.getByPlaceholder('Search Vendor').fill('testing vendor (638922541)');
      });

      await retryStep(popup, 'Select method', async () => {
        await popup.getByLabel('Timesheet', { exact: true }).click();
      });

      await retryStep(popup, 'Select Miles', async () => {
        await popup.locator("//span[normalize-space()='Miles']/ancestor::label//button[@role='checkbox']").click();
      });

      await retryStep(popup, 'Select Payer', async () => {
        await popup.getByText('Select Payer').click();
        await popup.getByText('WI IRIS-IRISW(IRIS-WI)').click();
      });

      await retryStep(popup, 'Select Service', async () => {
        await popup.getByText('Select Service').click();
        await popup.getByText('00240 Residential Services AFH 1-2 Beds').click();
      });

      await retryStep(popup, 'Enter Start Date', async () => {
        await popup.locator("//*[@for='start_date']/following-sibling::div//input").fill('03/20/2026');
      });

      await retryStep(popup, 'Enter End Date', async () => {
        await popup.locator("//*[@for='end_date']/following-sibling::div//input").fill('03/26/2026');
      });

      await retryStep(popup, 'Select Frequency', async () => {
        await popup.getByText('Select', { exact: true }).first().click();
        await popup.getByText('Monthly', { exact: true }).click();
      });

      await retryStep(popup, 'Enter Units', async () => {
        await popup.locator('#units_by_frequency').fill('2');
      });

      await retryStep(popup, 'Select Period', async () => {
        await popup.getByText('Select', { exact: true }).last().click();
        await popup.getByText('Month', { exact: true }).click();
      });

      await retryStep(popup, 'Enter Quantity', async () => {
        await popup.locator("//div[@class='bg-white flex items-center relative border border-kgray-600 rounded-md focus-within:border-[#333] mb-[2px] w-[110px] h-9 text-sm']//input[@type='number']").fill('10');
      });

      await retryStep(popup, 'Enter Total Units', async () => {
        await popup.locator('#total_units').fill('20');
      });

      await retryStep(popup, 'Select Hard Stop', async () => {
        await popup.locator("//span[normalize-space()='Hard Stop']/ancestor::label//button").click();
      });

      await retryStep(popup, 'Click Save', async () => {
        await popup.getByText('Save').click();
      });

      const toast = popup.locator("//*[contains(@class,'Toastify__toast-body')]");

      try {

        await toast.waitFor({ state: 'visible', timeout: 10000 });

        const message = (await toast.last().textContent())?.trim();

        if (message?.includes('successfully')) {
          success = true;
          console.log(`User ${i + 1} ✅ Authorization Saved`);
        }

      } catch {

        if (await popup.locator(`//*[@role='dialog']`).isVisible()) {
          let validation: string = await popup.locator(`//*[@role='dialog']`).innerText();
          console.log("Validation:\n" + validation);
        }

        await captureFailure(popup, i, 'auth-failure');

        console.log(`User ${i + 1} ❌ Authorization not saved`);

        recordError();
        fileRecordError(i);
        userMetrics[i].errors++;
      }

      await popup.close();

      await runTimesheetFlow(page);

      // ✅ Mark success only if no error paths occurred
      if (success) {
        console.log(`User ${i + 1} ✅ Workflow completed successfully`);
      } else {
        console.log(`User ${i + 1} ❌ Workflow completed but authorization was not confirmed`);
      }

    } catch (e: any) {

      success = false;
      await captureFailure(page, i, 'main-error');

      if (e.message.includes('Timeout')) {

        recordTimeout();

        fileRecordTimeout(i);

        userMetrics[i].timeouts++;
        userMetrics[i].errors++;

        await captureFailure(page, i, 'timeout');

      } else {

        recordError();

        fileRecordError(i);

        userMetrics[i].errors++;

        await captureFailure(page, i, 'error');
      }

    } finally {

      // ✅ Always capture duration
      const end = Date.now();
      const duration = end - start;

      // global metrics
      recordTime(duration);

      // file metrics
      fileRecordTime(duration, i);

      // per-user metrics
      userMetrics[i].duration = duration;
      userMetrics[i].success = success;
    }

  })
);

  // 📊 Global report
  printReport();

  // 👤 Per-user report
  console.log('\n👤 PER USER METRICS\n');

Object.entries(userMetrics).forEach(([user, data]) => {

  console.log(`User ${Number(user) + 1}:`);
  console.log(`  Requests: ${data.requests}`);
  console.log(`  Duration: ${data.duration.toFixed(2)} ms`);
  console.log(`  Success: ${data.success ? 'YES' : 'NO'}`);
  console.log(`  Errors: ${data.errors}`);
  console.log(`  Timeouts: ${data.timeouts}`);
  console.log('---------------------------');

});
});