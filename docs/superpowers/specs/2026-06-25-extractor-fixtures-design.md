# Offline HTML fixtures for the APOD extractor

**Date:** 2026-06-25
**Follows:** `2026-06-24-video-media-type-design.md` (the live-API 429 flakiness
that motivated this work surfaced while finishing that branch).

## Problem

The only test of the extractor `api/_data/getDataByDate.ts` is
`api/_data/getDataByDate.test.ts`, which compares our output against NASA's
official API (`api.nasa.gov`) over the network for a rolling 31-day window plus
spot-check dates. It depends on:

- network availability, and
- `NASA_API_KEY` — `DEMO_KEY` is aggressively rate-limited (HTTP 429), so the
  suite is flaky and cannot reliably run in CI or offline.

There is no way to test the parser deterministically because `getDataByDate`
fetches and parses in a single function — the only seam is the network.

## Goals

- Deterministic, offline unit tests of the extractor's parsing logic.
- Coverage of every branch of media detection plus known tricky parsing cases.
- Keep the existing live integration test unchanged (it still detects drift in
  NASA's HTML format over time).

Non-goals: changing `getDataByDate`'s behavior or signature; removing or
modifying the live test; testing the network/axios layer offline.

## Design

### 1. Refactor — split fetch from parse (no behavior change)

Extract two pure functions from `getDataByDate.ts`, keeping `getDataByDate`'s
signature and observable behavior identical:

- `decodeApodHtml(buf: Buffer): string` — the existing BOM-aware decode
  (currently lines 9-13: UTF-16LE when the BOM is `0xFF 0xFE`, else UTF-8).
- `parseApodHtml(html: string, date: DateTime): ApodEntry` — the existing
  cheerio parsing and field extraction (currently lines 16-62).

`getDataByDate(date)` becomes: `axios` GET (arraybuffer) →
`decodeApodHtml(buf)` → `parseApodHtml(html, date)`.

Both functions are exported from `getDataByDate.ts` (the file is small and the
logic belongs together; no new module). `getDataByDate` remains the primary
export and its callers (`api/index.ts`, `extractData.ts`, `backfillData.ts`,
the live test) are unaffected.

The test pipeline mirrors production exactly, minus the network:
`raw fixture bytes → decodeApodHtml → parseApodHtml → assert`. Because fixtures
are stored as raw bytes, the UTF-16LE fixture exercises the real decode path.

### 2. Fixtures — `api/_data/__fixtures__/`

For each case, two committed files:

- `<label>.html` — the raw downloaded page bytes.
- `<label>.expected.json` — the full expected `ApodEntry`, including `date`.

Cases:

| label | what it covers |
|-------|----------------|
| `image` | standard `<img>` image APOD |
| `iframe-video` | YouTube/Vimeo `<iframe>` embed → `media_type: video` |
| `html5-video` | native `<video><source ...mp4>` (2026-06-24, `sdo_cme.mp4`) |
| `other` | genuinely non-media page → `media_type: other` |
| `title-variant` | title/credit in one `<center>` separated by `<br>` (1997-03-01) |
| `utf16le-encoded` | UTF-16LE-encoded page → exercises `decodeApodHtml` |
| `credit-and-copyright` | page with both `Credit:` and `Copyright:` lines |

Pinned dates: `html5-video` = 2026-06-24, `title-variant` = 1997-03-01. The
remaining dates are selected during implementation by inspecting stored data
(an `other` date from the genuine-43; an `iframe-video` date from the 382
stored videos; a `credit-and-copyright` date exercising both regexes). If no
naturally UTF-16LE page is readily found, that one fixture is synthesized by
re-encoding a normal page to UTF-16LE + BOM — legitimate, because the fixture
exists solely to test `decodeApodHtml`.

### 3. Generation script — `extractor/fetchFixtures.ts`

A committed script holding the hardcoded `{date, label}` list. It downloads
each page's raw bytes (axios, `responseType: 'arraybuffer'`) into
`api/_data/__fixtures__/<label>.html`. Run once to capture; re-run to refresh
intentionally. It writes HTML only.

The `.expected.json` files are seeded from `parseApodHtml` output and then
human-reviewed against the live NASA page / official API before committing.
This is the "hand-authored" assertion: explicit committed JSON that a reviewer
reads, not auto-blessed Jest snapshots. The `utf16le-encoded` fixture, if
synthesized, is produced by the script re-encoding a fetched page.

### 4. Tests — `api/_data/getDataByDate.fixtures.test.ts`

Globs `api/_data/__fixtures__/*.html`. For each fixture: load the sibling
`.expected.json`, read the `.html` as a `Buffer`, run
`parseApodHtml(decodeApodHtml(buf), DateTime.fromISO(expected.date))`, and
assert `toEqual(expected)`. Fully offline, deterministic, fast. No network, no
`NASA_API_KEY`, no mocking.

The existing `getDataByDate.test.ts` is unchanged.

## Data flow & error handling

`raw bytes → decodeApodHtml → parseApodHtml → ApodEntry`, identical in
production and test. The pure functions introduce no new failure modes:
malformed or edge-case HTML produces the same result it does today (missing
elements fall through to `media_type: 'other'` / `undefined` fields).

## Testing strategy

- New offline fixture tests are the always-on coverage (run in CI, locally,
  offline).
- The existing live test remains for drift detection but is not relied upon for
  routine/offline runs.
- The refactor is verified by the existing tests continuing to pass: same
  inputs, same outputs.

## Order of work

1. Refactor `getDataByDate.ts` into `decodeApodHtml` + `parseApodHtml` +
   `getDataByDate`; confirm existing behavior is unchanged.
2. Add `extractor/fetchFixtures.ts`; capture the raw HTML fixtures.
3. Author and review the `.expected.json` files.
4. Add `getDataByDate.fixtures.test.ts`; confirm it passes offline.
