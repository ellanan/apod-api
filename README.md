# Astronomy Picture of the Day (APOD) API

APOD API written in Node.js and TypeScript to provide reliable API responses for Spacestagram II (https://spacestagram2.ellanan.com/).

- Automated daily extraction of APOD data from NASA’ website.
- Aggressively cache requests using Vercel’s CDN for cloud functions.
- Fall-back to on-demand data extraction.
- No API key required.

# Article

# Instruction Manual

### API EndPoint

https://apod.ellanan.com/api

### Query Params:

- `date`: a string in YYYY-MM-DD format indicating the date of the APOD image.
  - minimum date: 1995-06-20
  - maximum date: current date (Note NASA's APOD site updates at 12AM EST daily.)
  - returns the APOD for the date as a JSON object
- `start_date`: a string in YYYY-MM-DD format indicating the start date of a date range.
  - if a valid end_date is provided, returns all APODs in the range from start_date to end_date as a JSON object
  - if end_date is not provided, returns all APODs from the start_date to the current date as a JSON object
- `end-date`: a string in YYYY-MM-DD format indicating the end date of a date range.
  - must be used in combination with a valid start_date
- `count`: a positive integer.
  - invalid when used with date, start_date or end_date
  - returns a specified number of randomly generated APODs as a JSON object
- `limit`: a positive integer.
  - must be used in combination with a valid start_date
  - returns a specified number of APODs starting from the start_date as a JSON object

### Returned Fields:

- `title`: title of the APOD.
- `credit`: attribution to the owner of the APOD. (Note not all APODs have credit info.)
- `explanation`: detailed description of the APOD.
- `date`: APOD date.
- `hdurl`: high-resolution media URL of the APOD image or video.
- `service_version`: service version.
- `copyright`: name of the APOD's copyright holder.
- `media_type`: media type can be image, video or other.
- `url`: media URL of the APOD image or video.

# Examples

### Case: No argument passed.

`https://apod.ellanan.com/api`

<details><summary>This query will return the latest available APOD.</summary>
<p>

```javascript
{
"title": "Spiral Galaxy NGC 2841",
"explanation": "A mere 46 million light-years distant, spiral galaxy NGC 2841 can be found in the northern constellation of Ursa Major. This deep view of the gorgeous island universe was captured during 32 clear nights in November, December 2021 and January 2022. It shows off a striking yellow nucleus, galactic disk, and faint outer regions. Dust lanes, small star-forming regions, and young star clusters are embedded in the patchy, tightly wound spiral arms. In contrast, many other spirals exhibit grand, sweeping arms with large star-forming regions. NGC 2841 has a diameter of over 150,000 light-years, even larger than our own Milky Way. X-ray images suggest that resulting winds and stellar explosions create plumes of hot gas extending into a halo around NGC 2841.",
"date": "2022-03-03",
"hdurl": "https://apod.nasa.gov/apod/image/2203/NGC2841_20220114_72H.jpg",
"service_version": "v1",
"copyright": "Vitali Pelenjow",
"media_type": "image",
"url": "https://apod.nasa.gov/apod/image/2203/NGC2841_20220114_72H_1024.jpg"
}
```

</p>
</details>

<p></p>

### Case: Pass in date as an argument.

`https://apod.ellanan.com/api?date=2022-02-28`

<details><summary>This query will return the APOD for 2022-02-28.</summary>
<p>

```javascript
{
"title": "Direct Projection: The Moon in My Hands",
"explanation": "You don't have to look through a telescope to know where it's pointing. Allowing the telescope to project its image onto a large surface can be useful because it dilutes the intense brightness of very bright sources. Such dilution is useful for looking at the Sun, for example during a solar eclipse. In the featured single-exposure image, though, it is a too-bright full moon that is projected. This February full moon occurred two weeks ago and is called the Snow Moon by some northern cultures. The projecting instrument is the main 62-centimeter telescope at the Saint-Véran Observatory high in the French Alps. Seeing a full moon directly is easier because it is not too bright, although you won't see this level of detail. Your next chance will occur on March 17.",
"date": "2022-02-28",
"hdurl": "https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg",
"service_version": "v1",
"copyright": "Jeff Graphy",
"media_type": "image",
"url": "https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg"
}
```

</p>
</details>

<p></p>

### Case: Pass in start_date as an argument.

`https://apod.ellanan.com/api?start_date=2022-02-28`

<details><summary>This query will return all APODs from start_date (2022-02-28) to the current date (2022-03-03).</summary>
<p>

```javascript
[
  {
    title: 'Direct Projection: The Moon in My Hands',
    explanation:
      "You don't have to look through a telescope to know where it's pointing. Allowing the telescope to project its image onto a large surface can be useful because it dilutes the intense brightness of very bright sources. Such dilution is useful for looking at the Sun, for example during a solar eclipse. In the featured single-exposure image, though, it is a too-bright full moon that is projected. This February full moon occurred two weeks ago and is called the Snow Moon by some northern cultures. The projecting instrument is the main 62-centimeter telescope at the Saint-Véran Observatory high in the French Alps. Seeing a full moon directly is easier because it is not too bright, although you won't see this level of detail. Your next chance will occur on March 17.",
    date: '2022-02-28',
    hdurl: 'https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg',
    service_version: 'v1',
    copyright: 'Jeff Graphy',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg',
  },
  {
    title: 'Dueling Bands in the Night',
    explanation:
      'What are these two bands in the sky? The more commonly seen band is the one on the right and is the central band of our Milky Way galaxy. Our Sun orbits in the disk of this spiral galaxy, so that from inside, this disk appears as a band of comparable brightness all the way around the sky. The Milky Way band can also be seen all year -- if out away from city lights. The less commonly seem band, on the left, is zodiacal light -- sunlight reflected from dust orbiting the Sun in our Solar System. Zodiacal light is brightest near the Sun and so is best seen just before sunrise or just after sunset. On some evenings in the north, particularly during the months of March and April, this ribbon of zodiacal light can appear quite prominent after sunset. It was determined only this century that zodiacal dust was mostly expelled by comets that have passed near Jupiter. Only on certain times of the year will the two bands be seen side by side, in parts of the sky, like this. The featured image, including the Andromeda galaxy and a meteor, was captured in late January over a frozen lake in Kanding, Sichuan, China.',
    date: '2022-03-01',
    hdurl: 'https://apod.nasa.gov/apod/image/2203/DuelingBands_Dai_2000.jpg',
    service_version: 'v1',
    copyright: 'Jeff Dai (TWAN)',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2203/DuelingBands_Dai_960.jpg',
  },
  {
    title: 'Record Prominence Imaged by Solar Orbiter',
    credit: 'Solar Orbiter, EUI Team, ESA & NASA; h/t: Bum-Suk Yeom',
    explanation:
      "What's happened to our Sun? Last month, it produced the largest prominence ever imaged together with a complete solar disk. The record image, featured, was captured in ultraviolet light by the Sun-orbiting Solar Orbiter spacecraft. A quiescent solar prominence is a cloud of hot gas held above the Sun's surface by the Sun's magnetic field. This solar prominence was huge -- spanning a length rivaling the diameter of the Sun itself. Solar prominences may erupt unpredictably and expel hot gas into the Solar System via a Coronal Mass Ejection (CME). When a CME strikes the Earth and its magnetosphere, bright auroras may occur. This prominence did produce a CME, but it was directed well away from the Earth. Although surely related to the Sun's changing magnetic field, the energy mechanism that creates and sustains a solar prominence remains a topic of research.",
    date: '2022-03-02',
    hdurl:
      'https://apod.nasa.gov/apod/image/2203/SunEruption_SolarOrbiter_960.jpg',
    service_version: 'v1',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2203/SunEruption_SolarOrbiter_960.jpg',
  },
  {
    title: 'Spiral Galaxy NGC 2841',
    explanation:
      'A mere 46 million light-years distant, spiral galaxy NGC 2841 can be found in the northern constellation of Ursa Major. This deep view of the gorgeous island universe was captured during 32 clear nights in November, December 2021 and January 2022. It shows off a striking yellow nucleus, galactic disk, and faint outer regions. Dust lanes, small star-forming regions, and young star clusters are embedded in the patchy, tightly wound spiral arms. In contrast, many other spirals exhibit grand, sweeping arms with large star-forming regions. NGC 2841 has a diameter of over 150,000 light-years, even larger than our own Milky Way. X-ray images suggest that resulting winds and stellar explosions create plumes of hot gas extending into a halo around NGC 2841.',
    date: '2022-03-03',
    hdurl: 'https://apod.nasa.gov/apod/image/2203/NGC2841_20220114_72H.jpg',
    service_version: 'v1',
    copyright: 'Vitali Pelenjow',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2203/NGC2841_20220114_72H_1024.jpg',
  },
];
```

</p>
</details>

<p></p>

### Case: Pass in start_date and end_date as arguments.

`https://apod.ellanan.com/api?start_date=2022-02-28&end_date=2022-03-01`

<details><summary>This query will return APODs from start_date (2022-02-28) to end_date (2022-03-01).</summary>
<p>

```javascript
[
  {
    title: 'Direct Projection: The Moon in My Hands',
    explanation:
      "You don't have to look through a telescope to know where it's pointing. Allowing the telescope to project its image onto a large surface can be useful because it dilutes the intense brightness of very bright sources. Such dilution is useful for looking at the Sun, for example during a solar eclipse. In the featured single-exposure image, though, it is a too-bright full moon that is projected. This February full moon occurred two weeks ago and is called the Snow Moon by some northern cultures. The projecting instrument is the main 62-centimeter telescope at the Saint-Véran Observatory high in the French Alps. Seeing a full moon directly is easier because it is not too bright, although you won't see this level of detail. Your next chance will occur on March 17.",
    date: '2022-02-28',
    hdurl: 'https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg',
    service_version: 'v1',
    copyright: 'Jeff Graphy',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2202/MoonHands_Graphy_960.jpg',
  },
  {
    title: 'Dueling Bands in the Night',
    explanation:
      'What are these two bands in the sky? The more commonly seen band is the one on the right and is the central band of our Milky Way galaxy. Our Sun orbits in the disk of this spiral galaxy, so that from inside, this disk appears as a band of comparable brightness all the way around the sky. The Milky Way band can also be seen all year -- if out away from city lights. The less commonly seem band, on the left, is zodiacal light -- sunlight reflected from dust orbiting the Sun in our Solar System. Zodiacal light is brightest near the Sun and so is best seen just before sunrise or just after sunset. On some evenings in the north, particularly during the months of March and April, this ribbon of zodiacal light can appear quite prominent after sunset. It was determined only this century that zodiacal dust was mostly expelled by comets that have passed near Jupiter. Only on certain times of the year will the two bands be seen side by side, in parts of the sky, like this. The featured image, including the Andromeda galaxy and a meteor, was captured in late January over a frozen lake in Kanding, Sichuan, China.',
    date: '2022-03-01',
    hdurl: 'https://apod.nasa.gov/apod/image/2203/DuelingBands_Dai_2000.jpg',
    service_version: 'v1',
    copyright: 'Jeff Dai (TWAN)',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2203/DuelingBands_Dai_960.jpg',
  },
];
```

</p>
</details>

<p></p>

### Case: Pass in start_date and limit as arguments.

`https://apod.ellanan.com/api?start_date=2022-01-28&limit=3`

<details><summary>This query will return 3 APODs from start_date (2022-01-28) to (2022-01-30).</summary>
<p>

```javascript
[
  {
    title: 'Western Moon, Eastern Sea',
    explanation:
      "The Mare Orientale, Latin for Eastern Sea, is one of the most striking large scale lunar features. The youngest of the large lunar impact basins it's very difficult to see from an earthbound perspective. Still, taken during a period of favorable tilt, or libration of the lunar nearside, the Eastern Sea can be found near top center in this sharp telescopic view, extremely foreshortened along the Moon's western edge. Formed by the impact of an asteroid over 3 billion years ago and nearly 1000 kilometers across, the impact basin's concentric circular features are ripples in the lunar crust. But they are a little easier to spot in more direct images of the region taken from lunar orbit. So why is the Eastern Sea at the Moon's western edge? The Mare Orientale lunar feature was named before 1961. That's when the convention labeling east and west on lunar maps was reversed.",
    date: '2022-01-28',
    hdurl:
      'https://apod.nasa.gov/apod/image/2201/Mare_Orientale_Nov_27_2021_TGlenn_fullsize.jpg',
    service_version: 'v1',
    copyright: 'Tom Glenn',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2201/Mare_Orientale_Nov_27_2021_TGlenn_1024.jpg',
  },
  {
    title: 'The Fornax Cluster of Galaxies',
    explanation:
      'Named for the southern constellation toward which most of its galaxies can be found, the Fornax Cluster is one of the closest clusters of galaxies. About 62 million light-years away, it is almost 20 times more distant than our neighboring Andromeda Galaxy, and only about 10 percent farther than the better known and more populated Virgo Galaxy Cluster. Seen across this two degree wide field-of-view, almost every yellowish splotch on the image is an elliptical galaxy in the Fornax cluster. Elliptical galaxies NGC 1399 and NGC 1404 are the dominant, bright cluster members toward the upper left (but not the spiky foreground stars). A standout barred spiral galaxy NGC 1365 is visible on the lower right as a prominent Fornax cluster member.',
    date: '2022-01-29',
    hdurl: 'https://apod.nasa.gov/apod/image/2201/FornaxC1_FB.jpg',
    service_version: 'v1',
    copyright: 'Marco Lorenzi, Angus Lau, Tommy Tse',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2201/FornaxC1_FB1024.jpg',
  },
  {
    title: 'A Solar Prominence from SOHO',
    credit: 'NASA, ESA, SOHO-EIT Consortium',
    explanation:
      'How can gas float above the Sun? Twisted magnetic fields arching from the solar surface can trap ionized gas, suspending it in huge looping structures. These majestic plasma arches are seen as prominences above the solar limb. In 1999, this dramatic and detailed image was recorded by the Extreme ultraviolet Image Telescope (EIT) on board the space-based SOHO observatory in the light emitted by ionized Helium. It shows hot plasma escaping into space as a fiery prominence breaks free from magnetic confinement a hundred thousand kilometers above the Sun. These awesome events bear watching as they can affect communications and power systems over 100 million kilometers away on planet Earth. In late 2020 our Sun passed the solar minimum of its 11-year cycle and is now showing increased surface activity.',
    date: '2022-01-30',
    hdurl: 'https://apod.nasa.gov/apod/image/2201/sunprom3_soho_2100.jpg',
    service_version: 'v1',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2201/sunprom3_soho_960.jpg',
  },
];
```

</p>
</details>

<p></p>

### Case: Pass in start_date and limit as arguments.

`https://apod.ellanan.com/api?count=2`

<details><summary>This query will return specified number of randomly generated APODs. This is example, we got APODs for 2010-10-31 and 2020-06-05. </summary>
<p>

```javascript
[
  {
    title: 'Halloween and the Ghost Head Nebula',
    credit:
      'Mohammad Heydari-Malayeri (Observatoire de Paris) et al., ESA, NASA',
    explanation:
      "Halloween's origin is ancient and astronomical. Since the fifth century BC, Halloween has been celebrated as a cross-quarter day, a day halfway between an equinox (equal day / equal night) and a solstice (minimum day / maximum night in the northern hemisphere). With a modern calendar, however, the real cross-quarter day will occur next week. Another cross-quarter day is Groundhog's Day. Halloween's modern celebration retains historic roots in dressing to scare away the spirits of the dead. Perhaps a fitting tribute to this ancient holiday is this view of the Ghost Head Nebula taken with the Hubble Space Telescope. Similar to the icon of a fictional ghost, NGC 2080 is actually a star forming region in the Large Magellanic Cloud, a satellite galaxy of our own Milky Way Galaxy. The Ghost Head Nebula spans about 50 light-years and is shown in representative colors.",
    date: '2010-10-31',
    hdurl: 'https://apod.nasa.gov/apod/image/1010/ngc2080_hst_big.jpg',
    service_version: 'v1',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/1010/ngc2080_hst.jpg',
  },
  {
    title: 'Dragon over Central Park',
    explanation:
      "Still bathed in sunlight the International Space Station (ISS) arced through this Manhattan evening sky on May 30. Moving left to right, its bright trail was captured in this composite image with a series of 5 second long exposures. Stars left short trails and lights were reflected in still waters looking toward the north across the Central Park reservoir. Chasing the ISS in low Earth orbit the Crew Dragon spacecraft dubbed Endeavour also left a trail through that urban night. Seen about 6 hours after its launch the spacecraft's faint trail appears above the ISS, shown in the inset just as the two approached the bank of clouds at the right. Dragon Endeavour docked successfully with the ISS about nineteen hours after reaching orbit.",
    date: '2020-06-05',
    hdurl:
      'https://apod.nasa.gov/apod/image/2006/SHonda_ISS-Dragon-NY-0530.jpg',
    service_version: 'v1',
    copyright: 'Stan Honda',
    media_type: 'image',
    url: 'https://apod.nasa.gov/apod/image/2006/SHonda_ISS-Dragon-NY-0530_1024.jpg',
  },
];
```

</p>
</details>
