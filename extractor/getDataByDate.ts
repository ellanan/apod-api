import axios from 'axios';
import cheerio, { CheerioAPI } from 'cheerio';
import { DateTime } from 'luxon';

export const getDataByDate = async (date: DateTime) => {
  const html = (
    await axios.get(
      `https://apod.nasa.gov/apod/ap${date.toFormat('yyMMdd')}.html`
    )
  ).data;

  const $ = cheerio.load(html);

  const body = $('body').text();
  const title =
    // APOD's official API tries to find the title based on the html structure
    // https://github.com/nasa/apod-api/blob/e69d56d223543f84fb88ed6be292b48a7064297c/apod/utility.py#L125-L162
    $('center').length < 2
      ? $('title').text().split(' - ')[1].trim()
      : $('b').first().text().split('\n')[0].trim();

  const imageElement = $(
    'a[href^=image] img[src^=image], button img[src^=image]'
  );
  const videoElement = $('iframe');
  const embedElement = $('embed'); // these seem to be video embeds as well
  const description = $('center ~ center ~ p')
    .text()
    .replace(/\s+/g, ' ')
    .replace('Explanation:', '')
    .trim();
  const copyright =
    /copyright:\s+(.+)\s+explanation/gi.exec(body.replace(/\s+/gi, ' ')) || [];
  const credit =
    /credit:\s+(.+?)\s+(?:;|explanation)/gi.exec(body.replace(/\s+/gi, ' ')) ||
    [];

  const imageUrl =
    imageElement.attr('src') &&
    `https://apod.nasa.gov/apod/` + imageElement.attr('src');
  const hdImageUrl =
    $('a[href^=image]').attr('href') &&
    `https://apod.nasa.gov/apod/${$('a[href^=image]').attr('href')}`;

  return {
    title,
    credit,
    explanation: description,
    // dateOfCapture,
    date: date.toISODate(),
    // imageUrl,
    hdurl: hdImageUrl ?? imageUrl,
    // hdImageUrl,
    service_version: 'v1',
    copyright,
    media_type: imageUrl ? 'image' : videoElement.length ? 'video' : 'other',
    url: imageUrl ?? videoElement.attr('src'),
  };
};
