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
  console.log(`writing data for ${date.toISODate()}`);
  fs.writeFileSync(
    path.join(extractedDataDirectory, `${date.toISODate()}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

const files = fs.readdirSync(extractedDataDirectory);
const lastFile = _.last(files);
const lastIsoDate = lastFile?.split('.')[0];

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
    const downloadedDailyFiles = fs.readdirSync(extractedDataDirectory);

    // Group by year
    const byYear: Record<string, Record<string, object>> = {};
    for (const filename of downloadedDailyFiles) {
      const date = filename.split('.')[0];
      const year = date.substring(0, 4);
      const data = JSON.parse(
        fs.readFileSync(path.join(extractedDataDirectory, filename), 'utf-8')
      );
      if (!byYear[year]) {
        byYear[year] = {};
      }
      byYear[year][date] = data;
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
