import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import { getDataByDate } from './getDataByDate';
import { getDataByDateFromOriginalApodAPI } from '../../extractor/getDataByDateFromOriginalApodAPI';

const testInterval = (period: Interval[]) => {
  period.forEach(async (dailyInterval) => {
    test(dailyInterval.start.toFormat('yyyy-MM-dd'), async () => {
      const [originalAPIResponse, getDataByDateResponse] = await Promise.all([
        getDataByDateFromOriginalApodAPI(dailyInterval.start),
        getDataByDate(dailyInterval.start),
      ]);
      const massagedOriginalAPIResponse = {
        ...originalAPIResponse,
        explanation: originalAPIResponse.explanation.replace(/\s+/g, ' '),
      };

      expect(
        _.omit(massagedOriginalAPIResponse, [
          'explanation',
          // official API response often doesn't include complete copyright info
          'copyright',
          'title',
        ])
      ).toEqual(
        _.omit(getDataByDateResponse, [
          'explanation',
          // official API response doesn't include credits
          'credit',
          'copyright',
          'title',
        ])
      );

      expect(
        massagedOriginalAPIResponse.title
          // APOD's official API sometimes accidentally includes text on the next line that isn't part of the title
          // This happens on pages where the title and credits are in the same <center> element, separated by a <br>
          // e.g. for 1997-03-01, APOD API's title is "Galaxy  Dwingeloo 1 Emerges \r\nCredit:"
          .replace(/(\s*)(\r\n|\r|\n)(.+)/, '')
      ).toEqual(getDataByDateResponse.title);

      if (
        massagedOriginalAPIResponse.explanation.length >
        getDataByDateResponse.explanation.length
      ) {
        // official APOD API sometimes mistakenly includes footer data
        expect(massagedOriginalAPIResponse.explanation).toContain(
          getDataByDateResponse.explanation
        );
      } else {
        // official APOD API sometimes mistakenly cuts off the explanation
        // e.g. for 2004-10-01, it cuts off halfway at "Also known as Earth-crossing asteroid 4179, Toutatis"
        expect(getDataByDateResponse.explanation).toContain(
          massagedOriginalAPIResponse.explanation
        );
      }
    });
  });
};

describe('responses match official API for data from the past month', () => {
  testInterval(
    Interval.fromDateTimes(
      DateTime.now().minus({ days: 31 }),
      DateTime.now().minus({ days: 1 })
    ).splitBy({
      days: 1,
    })
  );
});

describe('responses match official API for data from a long time ago', () => {
  // the first week
  testInterval(
    Interval.fromISO('1995-06-20/1995-06-27').splitBy({
      days: 1,
    })
  );

  // spot check every month
  testInterval(
    Interval.fromISO('2011-02-01/2011-03-01').splitBy({
      months: 1,
    })
  );
});
