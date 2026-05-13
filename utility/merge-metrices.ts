import fs from 'fs';
import path from 'path';

const metricsDir = 'all-metrics';
const outputFile = 'metrics-temp.json';

let merged = '';

function walk(dir: string) {

  const files = fs.readdirSync(dir);

  for (const file of files) {

    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      walk(full);
    }

    else if (file === 'metrics-temp.json') {

      merged +=
        fs.readFileSync(full, 'utf-8') + '\n';
    }
  }
}

walk(metricsDir);

fs.writeFileSync(outputFile, merged);

console.log('✅ metrics merged');