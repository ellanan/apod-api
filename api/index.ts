import _ from 'lodash';
// The VercelRequest and VercelResponse imports are types for the Request and Response objects
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from './_data/getDataByDate';
import { transformData, ExplanationFormat } from './transformExplanation';

type ApodEntry = {
  title: string;
  credit?: string;
  explanation?: string;
  date: string;
  hdurl?: string;
  service_version: string;
  copyright?: string;
  media_type: string;
  url?: string;
};

const dataDictonary: Record<string, ApodEntry> = require('./_data/data.json');
const isoDates = Object.keys(dataDictonary);
const dailyData: ApodEntry[] = Object.values(dataDictonary);

let lastDayOfData = isoDates[isoDates.length - 1];

type OrignalAPIQueryParams = {
  date?: string;
  start_date?: string;
  end_date?: string;
  count?: string;
};

type AdditionalQueryParams = {
  limit?: string;
  format?: ExplanationFormat;
};

function getData(args: OrignalAPIQueryParams & AdditionalQueryParams): {
  cacheDurationMinutes: number;
  data: ApodEntry | ApodEntry[];
} {
  // if a date is passed, return the data for that date
  if (args.date) {
    return {
      cacheDurationMinutes: 60,
      data: dataDictonary[args.date],
    };
  }
  // if a start_date and end_date are passed, return the data for that date range
  if (args.start_date && args.end_date) {
    const dateInputRegex = /(\d{4})-(\d{1,})-(\d{1,})/;
    const [, startYear, startMonth, startDate] =
      args.start_date.match(dateInputRegex) ?? [];
    const [, endYear, endMonth, endDate] =
      args.end_date.match(dateInputRegex) ?? [];

    return {
      cacheDurationMinutes: 60 * 24 * 30,
      data: dailyData.slice(
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
      ),
    };
  }
  // if start_date is passed, return the data for that date and all future days
  // if both start_date and limit are passed, return the data for that date and limit days
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

    return {
      cacheDurationMinutes: 30,
      data: dailyData.slice(startingIndex, startingIndex + limit),
    };
  }
  // if count is passed, return a random subset of the data
  if (args.count) {
    return {
      cacheDurationMinutes: 0,
      data: _.sampleSize(dailyData, Number(args.count)),
    };
  }

  return {
    cacheDurationMinutes: 30,
    data: dailyData.slice(-1)[0],
  };
}

export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    const queryParams: OrignalAPIQueryParams & AdditionalQueryParams =
      request.query;

    const daysSinceLastData = Interval.fromDateTimes(
      DateTime.fromISO(lastDayOfData),
      DateTime.now().startOf('day')
    ).length('days');

    // handle the case where some data is missing
    if (daysSinceLastData >= 1) {
      console.log(
        `missing ${daysSinceLastData} days of data from ${lastDayOfData}`
      );
      // try to get the missing data from the last day of data
      const missingData = await Promise.all(
        Interval.fromDateTimes(
          DateTime.fromISO(lastDayOfData).startOf('day').plus({ days: 1 }),
          DateTime.now().endOf('day')
        )
          .splitBy({
            days: 1,
          })
          .map(async (interval) => {
            console.log(`getting data for ${interval.start.toISODate()}`);
            return getDataByDate(interval.start).catch((e) => {
              console.log(
                `error getting data for ${interval.start.toISODate()}`
              );
              if (e.response.status === 404) {
                // this day's data isn't available yet
                return null;
              }
              // throw expected error back up
              throw e;
            });
          })
      );

      const missingDataPairs = missingData.flatMap((entry) => {
        if (entry) {
          return [[entry.date, entry]] as [[string, typeof entry]];
        }
        return [];
      });

      console.log(`adding ${missingDataPairs.length} missing data pairs`);
      if (missingDataPairs.length > 0) {
        Object.assign(dataDictonary, _.fromPairs(missingDataPairs));
        isoDates.push(...missingDataPairs.map(([date, data]) => data.date));
        dailyData.push(...missingDataPairs.map(([date, data]) => data));
        lastDayOfData = missingDataPairs[missingDataPairs.length - 1][0];
      }
    }

    const { cacheDurationMinutes, data } = getData(queryParams);
    const format: ExplanationFormat = queryParams.format || 'text';
    const transformedData = transformData(data, format);

    response
      .status(200)
      .setHeader(
        'Cache-Control',
        `max-age=0, s-maxage=${
          cacheDurationMinutes * 60
        }, stale-while-revalidate=${cacheDurationMinutes * 60}` // cache could reuse a stale response while revalidating
      )
      .send(transformedData);
  } catch (error) {
    console.error(error);
    response.status(500).send(error);
  }
};
