# Fix `media_type: other` for HTML5 `<video>` APODs

**Issue:** [#6 — No link available when mediaType is other](https://github.com/ellanan/apod-api/issues/6)
**Date:** 2026-06-24

## Problem

When a NASA APOD is a video served as a native HTML5 `<video>` block, the API
returns `media_type: "other"` and no `url`. Example dates: `2026-04-06`,
`2026-06-24`. NASA's own API correctly returns `media_type: "video"` with the
`.mp4` URL.

The extractor in `api/_data/getDataByDate.ts` only recognizes two media kinds:

- images (`<img>` inside an image link)
- iframe video embeds (YouTube/Vimeo) via `$('iframe')`

NASA now also serves some videos as:

```html
<video width="960" height="540" controls autoplay muted>
  <source src="image/2606/sdo_cme.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>
```

There is no `<img>` and no `<iframe>`, so the entry falls through to
`media_type: 'other'` with `url: undefined`.

Two layers are affected:

1. **Extractor logic** — does not detect `<video>`/`<source>`. (Root cause.)
2. **Already-stored data** — the API serves baked-in per-year JSON files in
   `api/_data/years/`. Dates already stored as `"other"` (including the ones in
   the issue) are not re-fixed by the on-demand fallback in `api/index.ts`,
   which only fires for *missing future days*. So fixing the extractor alone
   leaves every past mp4-video date broken.

### Scope of stored data

Across all stored years there are 65 `"other"` entries (vs 10,881 images and
382 correctly-detected iframe videos). The `"other"` dates are scattered from
2001–2026, but the mp4-video ones cluster in the recent 2025–2026 range — the
older ones are genuinely "other" (Java applets, interactive pages).

## Design

### 1. Extractor fix — `api/_data/getDataByDate.ts`

Add detection for the native HTML5 `<video>` block:

- Rename the existing `videoElement = $('iframe')` → `iframeElement` for
  clarity, and add `htmlVideoElement = $('video')`.
- Resolve the video URL from `<video src>` or its child `<source src>`,
  converting a relative `image/...mp4` path to absolute
  (`https://apod.nasa.gov/apod/...`), with a guard so an already-absolute
  `http(s)` src is used as-is.
- Detection priority becomes: **image → iframe-video → html5-video → other**.

```js
media_type: imageUrl ? 'image' : iframeElement.length ? 'video' : htmlVideoUrl ? 'video' : 'other',
url:        imageUrl ?? iframeElement.attr('src') ?? htmlVideoUrl,
```

- `hdurl` stays absent for videos — this matches NASA's official API, which the
  tests compare against.

### 2. Re-extraction tooling — `extractor/backfillData.ts`

Add two new input modes alongside the existing `--start/--end` range:

- `--dates=YYYY-MM-DD,YYYY-MM-DD,...` — re-extract an explicit list of dates.
- `--reextract-other` — scan `api/_data/years/*.json`, collect every date
  currently `media_type: 'other'`, and re-extract those.

The existing merge-into-yearly-files + `generateYearsIndex` logic already
handles scattered dates, so no change is needed there.

Running `--reextract-other` regenerates the data: genuinely-"other" dates
re-parse identically, so only the real mp4-videos flip to `video` — a minimal,
self-verifying diff across `api/_data/years/*.json`,
`extractor/extractedDailyData/**`, and the generated `index.ts`.

### 3. Test (TDD) — `api/_data/getDataByDate.test.ts`

Add a `testInterval` spot-check block for known HTML5-video dates `2026-04-06`
and `2026-06-24`, reusing the existing pattern that compares our extractor
output against NASA's official API. The test compares `media_type` and `url`
(among other fields), so it:

- fails before the fix (`other` / `undefined`)
- passes after (`video` + correct mp4 URL)

Written first, per TDD. Requires `NASA_API_KEY` and network, consistent with the
existing suite.

## Data flow & error handling

NASA HTML → `getDataByDate` (cheerio parse) → entry → stored JSON → API serves.

No new failure modes: a `<video>` with no resolvable src still falls through to
`other` exactly as today.

## Order of work

1. Add the failing integration test for the two video dates.
2. Fix the extractor → test goes green.
3. Add the `--dates` and `--reextract-other` modes to `backfillData.ts`.
4. Run `--reextract-other`, commit the corrected data alongside the live fix.
