import axios from 'axios';
import { DateTime } from 'luxon';

export const getDataByDateFromOriginalApodAPI = (date: DateTime) =>
  axios
    .get(
      `https://api.nasa.gov/planetary/apod?api_key=${
        process.env.NASA_API_KEY
      }&date=${date.toFormat('yyyy-MM-dd')}`
    )
    .then((res) => res.data);
