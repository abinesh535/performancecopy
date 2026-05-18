import fs from 'fs';
import path from 'path';

const metricsDir = 'all-metrics';
const outputFile = 'metrics-temp.json';

let merged = '';

if (!fs.existsSync(metricsDir)) {
  fs.mkdirSync(metricsDir, { recursive: true });

  console.log(`⚠️ Created missing folder: ${metricsDir}`);
}

function walk(dir: string) {

  const files = fs.readdirSync(dir);

  for (const file of files) {

    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      walk(full);
    }

    else if (/^metrics-.*\.json$/.test(file)) {

      merged +=
        fs.readFileSync(full, 'utf-8') + '\n';
    }
  }
}

walk(metricsDir);

fs.writeFileSync(outputFile, merged);

console.log('✅ metrics merged');