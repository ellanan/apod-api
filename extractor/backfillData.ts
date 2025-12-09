import fs from 'fs';
import path from 'path';
import async from 'async';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from '../api/_data/getDataByDate';

const extractedDataDirectory = path.join(__dirname, 'extractedDailyData');
fs.mkdirSync(extractedDataDirectory, { recursive: true });

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
  console.log(`writing data for ${date.toISODate()}`);
  fs.writeFileSync(
    path.join(extractedDataDirectory, `${date.toISODate()}.json`),
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

    console.log(`combine data from all files in the 'extractedDailyData'`);
    const downloadedDailyFiles = fs.readdirSync(extractedDataDirectory);
    const combinedDailyDataDictionary = Object.fromEntries(
      downloadedDailyFiles.map((filename) => {
        const date = filename.split('.')[0];
        const data = JSON.parse(
          fs.readFileSync(path.join(extractedDataDirectory, filename), 'utf-8')
        );
        return [date, data];
      })
    );

    console.log(`Save all the files to a single file in the 'data.json'`);
    const outputDirectory = path.join(__dirname, '../api/_data');
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(outputDirectory, 'data.json'),
      JSON.stringify(combinedDailyDataDictionary, null, '  ')
    );

    console.log('Backfill complete!');
  }
);
