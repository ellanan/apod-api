import _ from 'lodash';
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

// Find the last extracted date by scanning year directories
function findLastExtractedDate(): string | undefined {
  const yearDirs = fs.readdirSync(extractedDataDirectory)
    .filter(f => /^\d{4}$/.test(f))
    .sort();
  if (yearDirs.length === 0) return undefined;
  const lastYear = yearDirs[yearDirs.length - 1];
  const files = fs.readdirSync(path.join(extractedDataDirectory, lastYear))
    .filter(f => f.endsWith('.json'))
    .sort();
  if (files.length === 0) return undefined;
  return files[files.length - 1].replace('.json', '');
}

const lastIsoDate = findLastExtractedDate();
console.log('starting from', lastIsoDate);

const startDate = DateTime.fromISO(lastIsoDate ?? '1995-06-16');
const endDate = DateTime.local();

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
    await saveDataForDate(interval.start).catch((e) => {
      console.log(`error getting data for ${interval.start.toISODate()}`);
      if (e.response.status === 404) {
        // this day's data isn't available yet
        return null;
      }
      // throw expected error back up
      throw e;
    });
    cb();
    console.log(`finished getting data for ${interval.start.toISODate()}`);
  },
  (err) => {
    if (err) throw err;
    console.log('All fetched!');

    console.log(`Grouping data by year...`);
    const yearDirs = fs.readdirSync(extractedDataDirectory)
      .filter(f => /^\d{4}$/.test(f))
      .sort();

    // Group by year
    const byYear: Record<string, Record<string, object>> = {};
    for (const year of yearDirs) {
      const yearPath = path.join(extractedDataDirectory, year);
      const files = fs.readdirSync(yearPath).filter(f => f.endsWith('.json'));
      byYear[year] = {};
      for (const filename of files) {
        const date = filename.replace('.json', '');
        const data = JSON.parse(
          fs.readFileSync(path.join(yearPath, filename), 'utf-8')
        );
        byYear[year][date] = data;
      }
    }

    // Write yearly files
    console.log(`Writing yearly JSON files...`);
    for (const [year, yearData] of Object.entries(byYear)) {
      const filePath = path.join(yearsDir, `${year}.json`);
      fs.writeFileSync(filePath, JSON.stringify(yearData, null, 2));
      console.log(`  ${year}.json: ${Object.keys(yearData).length} entries`);
    }

    // Generate index.ts
    console.log(`Generating index.ts...`);
    generateYearsIndex(yearsDir);

    console.log('Done!');
  }
);
