import async from 'async';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from './getDataByDate';

const startDate = DateTime.fromISO('2022-01-01');
const endDate = DateTime.local();

const dateInterval = Interval.fromDateTimes(
  startDate.startOf('day'),
  endDate.endOf('day')
).splitBy({
  days: 1,
});

const pages = async.mapLimit(
  dateInterval,
  8,
  async (interval, cb) => {
    try {
      cb(null, await getDataByDate(interval.start));
    } catch (error) {
      cb(error as Error);
    }
  },
  (err, result) => {
    if (err) throw err;
    console.log('asdfasdf');
    console.log({ result });
  }
);
