import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { retryStep } from '../utility/retry';
import { runTimesheetFlow } from '../pages/timesheet';
import { captureFailure } from '../utility/screenshot';

const usedAuthNumbers = new Set<string>();

import {
  recordTime as fileRecordTime,
  recordError as fileRecordError,
  recordTimeout as fileRecordTimeout,
  getData,
  calculate
} from '../utility/metrices';

// 📊 Global Metrics
let times: number[] = [];
let errors = 0;
let timeouts = 0;

// 👤 Per-user metrics
const userMetrics: Record<number, {
  times: number[];
  errors: number;
  timeouts: number;
}> = {};

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
  const total = times.length;
  const avg = total ? times.reduce((a, b) => a + b, 0) / total : 0;

  console.log('\n📊 TEST REPORT');
  console.log('Total Users:', users.length);
  console.log('Average Time:', avg.toFixed(2), 'ms');
  console.log('Errors:', errors);
  console.log('Timeouts:', timeouts);
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
        userMetrics[i] = { times: [], errors: 0, timeouts: 0 };
      }

      await delay(i * 3000);

      const start = Date.now();

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

        //await page.waitForLoadState('domcontentloaded');
        await page.locator("(//*[name()='svg'][@class='lucide lucide-ellipsis-vertical w-5 h-5'])[1]").click();

        const [popup] = await Promise.all([
          page.waitForEvent('popup'),
          page.getByText('Create Manual Authorization', { exact: true }).click()
        ]);

        await popup.bringToFront();

        // await popup.locator('#authorization_number')
        //   .fill(`auth${faker.number.int({ min: 8900, max: 9000 })}`);
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
            console.log(`User ${i + 1} ✅ Authorization Saved`);
          } 

        } catch {
          if (await popup.locator(`//*[@role='dialog']`).isVisible()) {
            let validation: string = await popup.locator(`//*[@role='dialog']`).innerText();
            console.log("Validation:\n" + validation);
            //await popup.locator('.cancel-auth').click();
          }
          await captureFailure(popup, i, 'auth-failure');

          console.log(`User ${i + 1} ❌ Authorization not saved`);
          recordError();
          fileRecordError(i);
          userMetrics[i].errors++;
        }

        await popup.close();
        await runTimesheetFlow(page);

      } catch (e: any) {
        await captureFailure(page, i, 'main-error');
        if (e.message.includes('Timeout')) {
          recordTimeout();
          fileRecordTimeout(i);
          userMetrics[i].timeouts++;
           await captureFailure(page, i, 'timeout');
        } else {
          recordError();
          fileRecordError(i);
          userMetrics[i].errors++;
           await captureFailure(page, i, 'error');
        }
      }

      finally {
  const end = Date.now();
  const duration = end - start;

  recordTime(duration);
  fileRecordTime(duration, i);

  if (!userMetrics[i]) {
    userMetrics[i] = { times: [], errors: 0, timeouts: 0 };
  }

  userMetrics[i].times.push(duration);
}
    })
  );

  // 📊 Global report
  printReport();

  // 👤 Per-user report
  console.log('\n👤 PER USER METRICS\n');

  Object.entries(userMetrics).forEach(([user, data]) => {
    const total = data.times.length;
    const avg = total ? data.times.reduce((a, b) => a + b, 0) / total : 0;

    console.log(`User ${Number(user) + 1}:`);
    console.log(`  Requests: ${total}`);
    console.log(`  Avg: ${avg.toFixed(2)} ms`);
    console.log(`  Errors: ${data.errors}`);
    console.log(`  Timeouts: ${data.timeouts}`);
    console.log('---------------------------');
  })
});