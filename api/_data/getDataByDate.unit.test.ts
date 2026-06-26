import { DateTime } from 'luxon';
import { decodeApodHtml, parseApodHtml } from './getDataByDate';

describe('decodeApodHtml', () => {
  test('decodes UTF-8 buffers', () => {
    const buf = Buffer.from('<title>APOD - Hello</title>', 'utf8');
    expect(decodeApodHtml(buf)).toContain('Hello');
  });

  test('decodes UTF-16LE buffers (BOM 0xFF 0xFE)', () => {
    const buf = Buffer.from('﻿<title>APOD - Hello</title>', 'utf16le');
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xfe);
    expect(decodeApodHtml(buf)).toContain('Hello');
  });
});

describe('parseApodHtml', () => {
  const date = DateTime.fromISO('2022-02-28');

  test('classifies an image page and resolves urls', () => {
    const html = `
      <title>APOD - Test Image</title>
      <center></center>
      <center>
        <a href="image/2202/foo.jpg"><img src="image/2202/foo_1024.jpg"></a>
      </center>
      <center></center>
      <p>Explanation: A test image.</p>`;
    const result = parseApodHtml(html, date);
    expect(result.media_type).toBe('image');
    expect(result.url).toBe('https://apod.nasa.gov/apod/image/2202/foo_1024.jpg');
    expect(result.hdurl).toBe('https://apod.nasa.gov/apod/image/2202/foo.jpg');
    expect(result.date).toBe('2022-02-28');
  });

  test('classifies an HTML5 <video> page', () => {
    const html = `
      <title>APOD - Test Video</title>
      <center></center>
      <center>
        <video controls><source src="image/2206/bar.mp4" type="video/mp4"></video>
      </center>
      <center></center>
      <p>Explanation: A test video.</p>`;
    const result = parseApodHtml(html, date);
    expect(result.media_type).toBe('video');
    expect(result.url).toBe('https://apod.nasa.gov/apod/image/2206/bar.mp4');
  });
});
