import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { decodeApodHtml, parseApodHtml } from './getDataByDate';

const fixturesDir = path.join(__dirname, '__fixtures__');

const htmlFiles = fs
  .readdirSync(fixturesDir)
  .filter((f) => f.endsWith('.html'))
  .sort();

describe('parseApodHtml matches saved expected output for NASA fixtures', () => {
  test('there are fixtures to run', () => {
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  test.each(htmlFiles)('%s', (htmlFile) => {
    const label = htmlFile.replace(/\.html$/, '');
    const expected = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, `${label}.expected.json`), 'utf-8')
    );
    const buf = fs.readFileSync(path.join(fixturesDir, htmlFile));
    const result = parseApodHtml(decodeApodHtml(buf), DateTime.fromISO(expected.date));
    expect(result).toEqual(expected);
  });
});
