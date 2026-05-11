import fs from 'fs';
import path from 'path';
import { Page } from '@playwright/test';

export async function captureFailure(page: Page, userIndex: number, reason: string) {
  try {
    const dir = path.resolve('screenshots');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `user-${userIndex + 1}-${reason}-${Date.now()}.png`;

    const filePath = path.join(dir, fileName);

    await page.screenshot({
      path: filePath,
      fullPage: true
    });

    console.log(`📸 Screenshot saved: ${fileName}`);
  } catch (e) {
    console.log('⚠️ Failed to capture screenshot');
  }
}