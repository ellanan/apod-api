import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { decodeApodHtml } from '../api/_data/getDataByDate';

const fixturesDir = path.join(__dirname, '../api/_data/__fixtures__');
fs.mkdirSync(fixturesDir, { recursive: true });

// Each fixture captures a real NASA APOD page exercising a specific code path.
const FIXTURES: { label: string; date: string }[] = [
  { label: 'image', date: '2022-02-28' },
  { label: 'iframe-video', date: '2008-07-22' },
  { label: 'html5-video', date: '2026-06-24' },
  { label: 'other', date: '2002-05-10' },
  { label: 'title-variant', date: '1997-03-01' },
  { label: 'credit-and-copyright', date: '1995-09-01' },
];

async function fetchPage(date: string): Promise<Buffer> {
  const d = DateTime.fromISO(date);
  const url = `https://apod.nasa.gov/apod/ap${d.toFormat('yyMMdd')}.html`;
  console.log(`fetching ${url}`);
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

async function main() {
  let imageBuf: Buffer | undefined;
  for (const { label, date } of FIXTURES) {
    const buf = await fetchPage(date);
    fs.writeFileSync(path.join(fixturesDir, `${label}.html`), buf);
    console.log(`wrote ${label}.html (${buf.length} bytes)`);
    if (label === 'image') imageBuf = buf;
  }

  // Synthesize a UTF-16LE fixture from the image page so the test exercises
  // decodeApodHtml's BOM path deterministically (real UTF-16LE NASA pages are
  // rare and hard to pin to a stable date).
  if (!imageBuf) throw new Error('image fixture missing; cannot synthesize utf16le');
  const utf16le = Buffer.from('﻿' + decodeApodHtml(imageBuf), 'utf16le');
  fs.writeFileSync(path.join(fixturesDir, 'utf16le-encoded.html'), utf16le);
  console.log(`wrote utf16le-encoded.html (${utf16le.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
