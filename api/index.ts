// The VercelRequest and VercelResponse imports are types for the Request and Response objects
import _ from 'lodash';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const dataDictonary = require('./_data/data.json');
const isoDates = Object.keys(dataDictonary);
const dailyData = Object.values(dataDictonary);

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

  response.status(200).send(getData(queryParams));
};
