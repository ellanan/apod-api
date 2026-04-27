import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { getDataByDate } from '../api/_data/getDataByDate';

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

const yearsDir = path.join(__dirname, '../api/_data/years');
const extractedDataDirectory = path.join(__dirname, 'extractedDailyData');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

function stripHtml(text?: string): string {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isBuggyEntry(entry: ApodEntry): boolean {
  if (!entry.copyright) return false;

  const normalizedCopyright = entry.copyright.replace(/\s+/g, ' ').trim();
  const lowerCopyright = normalizedCopyright.toLowerCase();
  if (lowerCopyright.includes('explanation:')) return true;

  const explanationText = stripHtml(entry.explanation);
  if (!explanationText) return false;

  const prefix = explanationText.slice(0, 40);
  if (prefix.length < 40) return false;

  return normalizedCopyright.includes(prefix);
}

function loadYearData(): Record<string, Record<string, ApodEntry>> {
  const yearFiles = fs
    .readdirSync(yearsDir)
    .filter((file) => /^\d{4}\.json$/.test(file))
    .sort();

  const dataByYear: Record<string, Record<string, ApodEntry>> = {};
  for (const file of yearFiles) {
    const year = file.replace('.json', '');
    const filePath = path.join(yearsDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    dataByYear[year] = JSON.parse(raw) as Record<string, ApodEntry>;
  }

  return dataByYear;
}

function writeYearData(year: string, data: Record<string, ApodEntry>): void {
  const filePath = path.join(yearsDir, `${year}.json`);
  const sortedData = Object.fromEntries(
    Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2));
}

async function main() {
  const dataByYear = loadYearData();
  const buggyDates: string[] = [];

  for (const [year, entries] of Object.entries(dataByYear)) {
    for (const [date, entry] of Object.entries(entries)) {
      if (isBuggyEntry(entry)) {
        buggyDates.push(date);
      }
    }
  }

  if (buggyDates.length === 0) {
    console.log('No buggy entries found.');
    return;
  }

  buggyDates.sort();

  console.log(`Found ${buggyDates.length} buggy entries:`);
  console.log(buggyDates.join('\n'));

  if (!shouldFix) return;

  fs.mkdirSync(extractedDataDirectory, { recursive: true });

  const affectedYears = new Set<string>();

  for (const isoDate of buggyDates) {
    const date = DateTime.fromISO(isoDate);
    const year = isoDate.slice(0, 4);

    console.log(`re-fetching ${isoDate}`);
    const freshData = await getDataByDate(date);

    const yearDir = path.join(extractedDataDirectory, year);
    fs.mkdirSync(yearDir, { recursive: true });
    fs.writeFileSync(
      path.join(yearDir, `${isoDate}.json`),
      JSON.stringify(freshData, null, 2),
      'utf8'
    );

    dataByYear[year][isoDate] = freshData;
    affectedYears.add(year);
  }

  for (const year of Array.from(affectedYears).sort()) {
    writeYearData(year, dataByYear[year]);
    console.log(`updated ${year}.json`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
