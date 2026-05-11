import fs from 'fs';
import path from 'path';

export async function retryStep(
  page: any,
  stepName: string,
  action: () => Promise<void>,
  retries = 2
) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      await action();
      return; // ✅ success
    } catch (err) {

      console.log(`⚠️ ${stepName} failed (attempt ${attempt})`);

      // 📸 Take screenshot on every failure attempt
      const dir = path.resolve('screenshots');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const filePath = path.join(
        dir,
        `${stepName.replace(/\s+/g, '_')}_attempt${attempt}.png`
      );

      await page.screenshot({ path: filePath, fullPage: true });

      if (attempt === retries + 1) {
        console.log(`❌ ${stepName} failed after ${retries + 1} attempts`);
        throw err;
      }

      await page.waitForTimeout(1000);
    }
  }
}