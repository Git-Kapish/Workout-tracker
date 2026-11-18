# Phase 6 checklist (plan.md section 10)

Each item says what is **already proven by automated tests** and what **only you can check on the iPhone**.
Run `npm run check` for the automated part. Tick the "Phone" boxes yourself.

Legend: ✅ proven by tests · 📱 needs your phone · both = test covers the logic, the phone covers the real device.

## Dates and weeks

- ✅ Late Sunday belongs to the current week, Monday starts a new one: `weeks.test` (every weekday; "Sunday belongs to the week that began the previous Monday"), `useWeek.test` (Sunday/Monday land in different weeks). 📱 [ ] Optionally log something around midnight Sunday to Monday.
- ✅ Week crossing a month boundary (Mar 30 to Apr 5): `weeks.test`, `useWeek.test`.
- ✅ Week crossing New Year and ISO week 53 (Dec 28 to Jan 3; 2026 has 53 ISO weeks): `weeks.test`, `useWeek.test`, `progress.test`.
- ✅ Leap day (Feb 29, 2028): `dates.test`, `weeks.test`, `useWeek.test`.
- ✅ Time zone or DST never moves an entry: dates are plain `YYYY-MM-DD` strings with UTC arithmetic; the date tests also ran under New York, Auckland and Kolkata, and cover the US and EU DST weeks. 📱 [ ] Change the phone's time zone (Settings, General, Date & Time) and confirm an entry stays on its day.
- ✅ Editing an entry's date moves it to the right day and week: `useWeek.test` ("moves an entry to another week"). 📱 [ ] Try it once in the app.

## Metrics and comparison

- ✅ First ever week shows "No baseline", never NaN/Infinity: `compare.test`, `ProgressScreen.test`.
- ✅ Last week had entries, this week none shows a 100% drop: `ProgressScreen.test` ("Down 100%").
- ✅ Blank weight counts reps, adds 0 volume: `metrics.test`, `personalBests.test`.
- ✅ Decimal weights have no float noise (0.1 + 0.2): `metrics.test`, `personalBests.test`, `format.test`.
- ✅ Percent change rounds half away from zero, with the right sign: `compare.test`, `format.test`.

## Input

- ✅ Weight typed with `,` is accepted: `validation.test`, `EntryForm.test`. 📱 [ ] Type `42,5` with the real iPhone decimal keyboard.
- ✅ Zero, negative and decimal sets/reps are rejected with clear messages: `validation.test`, `EntryForm.test`.
- ✅ (logic) Very long names are stored in full up to 60 characters; rows truncate with an ellipsis. 📱 [ ] Log a 60-character name and look at Today, Week and Exercises.
- ✅ Very large numbers are rejected, not stored: `validation.test`, DB CHECK constraints in `migrations.test`.
- ✅ Names differing only by case or spacing are the same exercise: `exercises.test`, `ExercisesScreen.test`.
- ✅ Rapid double-tap on Save creates one entry: `EntryForm.test` (also shown to fail when the guard is removed). 📱 [ ] Try a fast double tap.

## UI

- 📱 [ ] The keyboard never covers the focused input or Save button (log sheet, search field).
- 📱 [ ] Safe areas are respected on a notched iPhone (tab bar above the home indicator).
- ✅ Dark mode text is readable: every colour pair is contrast-checked in both appearances (`contrast.test`); no hard-coded colours outside the theme (`codebase.test`). 📱 [ ] Look at every screen once in dark mode (Settings, Display & Brightness).
- ✅ Delete always asks for confirmation: `EntryForm.test`.
- ✅ Nothing needs the network: `codebase.test` finds no fetch, XHR, WebSocket or URL in the app code. 📱 [ ] Turn on Airplane Mode and use the app.
- 📱 [ ] The app is portrait-only; switching apps and coming back keeps the open Log sheet and what you typed.
- ✅ Every button, tab and text field has a spoken name on every screen: `accessibility.test`. 📱 [ ] Turn on VoiceOver and swipe through one screen.
- 📱 [ ] Larger text: Settings, Display & Brightness, Text Size, one or two steps up; nothing should be cut off (rows grow, tight spots are capped).

## Data

- 📱 [ ] Data survives closing and reopening the app (confirmed in Phase 1) **and a full phone restart**.
- ✅ A new migration on existing data keeps all entries: `migrations.test` ("upgrades a shipped v1 database with real data"). The real v1 to v2 upgrade already happened on your phone in Phase 2.
- ✅ CSV export: header, one row per entry in date order, RFC 4180 quoting, a byte-order mark so Excel reads accents, and a lossless round trip for names with commas, quotes, line breaks, accents and emoji: `csv.test`, `exportCsv.test`, `ExportButton.test`. 📱 [ ] Tap the export button, save to Files or AirDrop it, and open it in Numbers or Excel; check an accented name.
- ✅ 5,000 entries: the queries use their indexes and finish in a few milliseconds in Node (`largeDataset.test`); inactive tabs no longer refetch after every write (`useRepositoryQuery.test`). 📱 [ ] On the phone, long-press the Today greeting, tap "Add 5000 fake entries" (about a minute), then open every tab, scroll Exercise detail and export. Finish with "Remove fake entries".
