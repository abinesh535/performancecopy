import fs from 'fs';
import path from 'path';

export function cleanFolders() {
  const folders = [
    'screenshots',
    'videos',
    'playwright-report',
    'test-results'
  ];

  for (const folder of folders) {
    const dir = path.resolve(folder);

    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🧹 Deleted ${folder}`);
    }
  }
}