import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import async from 'async';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from '../api/_data/getDataByDate';

const extractedDataDirectory = path.join(__dirname, 'extractedDailyData');
fs.mkdirSync(extractedDataDirectory, { recursive: true }); // recursive true returns the first directory path created

async function saveDataForDate(date: DateTime) {
  const data = await getDataByDate(date);
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

const startDate = DateTime.fromISO(lastIsoDate ?? '1995-06-20');
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
    try {
      await saveDataForDate(interval.start);
      cb();
    } catch (error) {
      cb(error as Error);
    }
  },
  (err) => {
    if (err) throw err;
    console.log('All done!');
  }
);

// combine data from all files in the 'extractedDailyData'
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

// Save all the files to a single file in the 'data.json'
const outputDirectory = path.join(__dirname, '../api/_data');
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, 'data.json'),
  JSON.stringify(combinedDailyDataDictionary, null, '  ')
);
