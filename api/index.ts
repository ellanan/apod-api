// The VercelRequest and VercelResponse imports are types for the Request and Response objects
import _ from 'lodash';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from './_data/getDataByDate';

const dataDictonary = require('./_data/data.json');
const isoDates = Object.keys(dataDictonary);
const dailyData = Object.values(dataDictonary);

let lastDayOfData = isoDates[isoDates.length - 1];

type OrignalAPIQueryParams = {
  date?: string;
  start_date?: string;
  end_date?: string;
  count?: string;
};

type AdditionalQueryParams = {
  limit?: string;
};

function getData(args: OrignalAPIQueryParams & AdditionalQueryParams) {
  if (Object.keys(args).length === 0) {
    return Object.entries(dataDictonary)
      .map(([date, value]) => value)
      .slice(-1)[0];
  }
  if (args.date) {
    return dataDictonary[args.date];
  }
  if (args.start_date && args.end_date) {
    const dateInputRegex = /(\d{4})-(\d{1,})-(\d{1,})/;
    const [, startYear, startMonth, startDate] =
      args.start_date.match(dateInputRegex) ?? [];
    const [, endYear, endMonth, endDate] =
      args.end_date.match(dateInputRegex) ?? [];

    return dailyData.slice(
      isoDates.indexOf(
        `${startYear}-${_.padStart(startMonth, 2, '0')}-${_.padStart(
          startDate,
          2,
          '0'
        )}`
      ),
      isoDates.indexOf(
        `${endYear}-${_.padStart(endMonth, 2, '0')}-${_.padStart(
          endDate,
          2,
          '0'
        )}`
      ) + 1
    );
  }
  if (args.start_date) {
    const dateInputRegex = /(\d{4})-(\d{1,})-(\d{1,})/;
    const [, startYear, startMonth, startDate] =
      args.start_date.match(dateInputRegex) ?? [];
    const limit = Number(args.limit) || Infinity;

    const startingIndex = isoDates.indexOf(
      `${startYear}-${_.padStart(startMonth, 2, '0')}-${_.padStart(
        startDate,
        2,
        '0'
      )}`
    );

    return dailyData.slice(startingIndex, startingIndex + limit);
  }
  if (args.count) {
    return _.sampleSize(dailyData, Number(args.count));
  }
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const queryParams: OrignalAPIQueryParams & AdditionalQueryParams =
    request.query;

  const daysSinceLastData = Interval.fromDateTimes(
    DateTime.fromISO(lastDayOfData),
    DateTime.now().startOf('day')
  ).length('days');

  if (daysSinceLastData < 1) {
    response.status(200).send(getData(queryParams));
  } else {
    console.log(
      `missing ${daysSinceLastData} days of data from ${lastDayOfData}`
    );
    const missingData = await Promise.all(
      Interval.fromDateTimes(
        DateTime.fromISO(lastDayOfData).startOf('day').plus({ days: 1 }),
        DateTime.now().endOf('day')
      )
        .splitBy({
          days: 1,
        })
        .map(async (interval) => {
          try {
            return getDataByDate(interval.start);
          } catch (error) {
            console.error(`could not fetch data for ${interval.start}`, error);
            return null;
          }
        })
    );
    const missingDataPairs = missingData.flatMap((entry) => {
      if (entry) {
        return [[entry.date, entry]] as [[string, typeof entry]];
      }
      return [];
    });

    Object.assign(dataDictonary, _.fromPairs(missingDataPairs));
    isoDates.push(...missingDataPairs.map(([date, data]) => data.date));
    dailyData.push(...missingDataPairs.map(([date, data]) => data));
    lastDayOfData = missingDataPairs[missingDataPairs.length - 1][1].date;

    response.status(200).send(getData(queryParams));
  }
};
