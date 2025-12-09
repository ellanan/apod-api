import fs from 'fs';
import path from 'path';
import { generateYearsIndex } from './generateYearsIndex';

const dataJsonPath = path.join(__dirname, '../api/_data/data.json');
const yearsDir = path.join(__dirname, '../api/_data/years');

// Create years directory
fs.mkdirSync(yearsDir, { recursive: true });

// Read existing data
console.log('Reading data.json...');
const data: Record<string, object> = JSON.parse(
  fs.readFileSync(dataJsonPath, 'utf-8')
);

// Group by year
const byYear: Record<string, Record<string, object>> = {};

for (const [date, entry] of Object.entries(data)) {
  const year = date.substring(0, 4);
  if (!byYear[year]) {
    byYear[year] = {};
  }
  byYear[year][date] = entry;
}

// Write yearly files
const years = Object.keys(byYear).sort();
console.log(`Splitting into ${years.length} yearly files...`);

for (const year of years) {
  const yearData = byYear[year];
  const entryCount = Object.keys(yearData).length;
  const filePath = path.join(yearsDir, `${year}.json`);
  fs.writeFileSync(filePath, JSON.stringify(yearData, null, 2));
  console.log(`  ${year}.json: ${entryCount} entries`);
}

// Generate index.ts with static imports
console.log('Generating index.ts...');
generateYearsIndex(yearsDir);

console.log('Done!');
console.log(`\nNext steps:`);
console.log(`  1. Update api/index.ts to import from './_data/years'`);
console.log(`  2. Run tests to verify`);
console.log(`  3. Delete api/_data/data.json`);
