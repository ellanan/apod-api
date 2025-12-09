import fs from 'fs';
import path from 'path';
import async from 'async';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from '../api/_data/getDataByDate';
import { generateYearsIndex } from './generateYearsIndex';

const extractedDataDirectory = path.join(__dirname, 'extractedDailyData');
fs.mkdirSync(extractedDataDirectory, { recursive: true });

const yearsDir = path.join(__dirname, '../api/_data/years');
fs.mkdirSync(yearsDir, { recursive: true });

// Parse command line arguments
const args = process.argv.slice(2);
const startDateArg = args.find((arg) => arg.startsWith('--start='))?.split('=')[1];
const endDateArg = args.find((arg) => arg.startsWith('--end='))?.split('=')[1];

if (!startDateArg || !endDateArg) {
  console.error('Usage: ts-node extractor/backfillData.ts --start=YYYY-MM-DD --end=YYYY-MM-DD');
  console.error('Example: ts-node extractor/backfillData.ts --start=2025-10-02 --end=2025-11-12');
  process.exit(1);
}

const startDate = DateTime.fromISO(startDateArg);
const endDate = DateTime.fromISO(endDateArg);

if (!startDate.isValid) {
  console.error(`Invalid start date: ${startDateArg}`);
  process.exit(1);
}

if (!endDate.isValid) {
  console.error(`Invalid end date: ${endDateArg}`);
  process.exit(1);
}

if (startDate > endDate) {
  console.error('Start date must be before or equal to end date');
  process.exit(1);
}

console.log(`Backfilling data from ${startDate.toISODate()} to ${endDate.toISODate()}`);

async function saveDataForDate(date: DateTime) {
  const data = await getDataByDate(date);
  const year = date.toISODate()!.substring(0, 4);
  const yearDir = path.join(extractedDataDirectory, year);
  fs.mkdirSync(yearDir, { recursive: true });
  console.log(`writing data for ${date.toISODate()}`);
  fs.writeFileSync(
    path.join(yearDir, `${date.toISODate()}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

const dateInterval = Interval.fromDateTimes(
  startDate.startOf('day'),
  endDate.endOf('day')
).splitBy({
  days: 1,
});

// run 8 async operations at a time
async.eachLimit(
  dateInterval,
  8,
  async (interval, cb) => {
    await saveDataForDate(interval.start!).catch((e) => {
      console.log(`error getting data for ${interval.start?.toISODate()}`);
      if (e.response?.status === 404) {
        // this day's data isn't available yet
        return null;
      }
      // throw unexpected error back up
      throw e;
    });
    cb();
    console.log(`finished getting data for ${interval.start?.toISODate()}`);
  },
  (err) => {
    if (err) throw err;
    console.log('All fetched!');

    // Group backfilled data by year (from year subdirectories)
    const backfilledByYear: Record<string, Record<string, object>> = {};
    const yearDirs = fs.readdirSync(extractedDataDirectory)
      .filter(f => /^\d{4}$/.test(f))
      .sort();

    for (const year of yearDirs) {
      const yearPath = path.join(extractedDataDirectory, year);
      const files = fs.readdirSync(yearPath).filter(f => f.endsWith('.json'));
      if (files.length === 0) continue;
      backfilledByYear[year] = {};
      for (const filename of files) {
        const date = filename.replace('.json', '');
        const data = JSON.parse(
          fs.readFileSync(path.join(yearPath, filename), 'utf-8')
        );
        backfilledByYear[year][date] = data;
      }
    }

    // Merge into yearly files
    console.log(`Merging backfilled data into yearly files...`);
    const affectedYears = Object.keys(backfilledByYear).sort();

    for (const year of affectedYears) {
      const yearFilePath = path.join(yearsDir, `${year}.json`);
      const existingData = fs.existsSync(yearFilePath)
        ? JSON.parse(fs.readFileSync(yearFilePath, 'utf-8'))
        : {};

      const mergedData = { ...existingData, ...backfilledByYear[year] };
      // Sort by date key
      const sortedData = Object.fromEntries(
        Object.entries(mergedData).sort(([a], [b]) => a.localeCompare(b))
      );

      fs.writeFileSync(yearFilePath, JSON.stringify(sortedData, null, 2));
      console.log(`  ${year}.json: merged ${Object.keys(backfilledByYear[year]).length} entries`);
    }

    // Regenerate index.ts
    console.log(`Regenerating index.ts...`);
    generateYearsIndex(yearsDir);

    console.log(`Backfill complete!`);
  }
);
