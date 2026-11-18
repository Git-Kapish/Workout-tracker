# Workout Tracker — Implementation Plan

Context document for Claude Code. Read this fully before writing code. Follow the phases in order; do not start a phase until the previous phase's "Done when" checks pass.

---

## 1. Project summary

A personal workout tracking app built with **Expo (React Native) + TypeScript**, running on an **iPhone**, developed on a **Windows laptop**.

The user logs exercises with **name, sets, reps per set, weight (kg)** and the **date performed**. The app shows:

1. A **week view** for any week (Monday–Sunday) with the exercises logged each day.
2. A **progress section** comparing **this week vs last week** (total reps, total volume, exercises logged, percent change, Up/Same/Down badge) plus a weekly chart.
3. Per-exercise history and personal bests.

This app replaces a Notion tracker (Workout Log + Weekly Progress databases). Notion sync is **out of scope** for v1.

### Quality bar
The user wants an app with **no bugs or faults**. That is not guaranteed by any process, so the working rule is: **every piece of logic that can be wrong (dates, weeks, sums, percentages, validation) is a pure function with unit tests, and every phase is verified on the real iPhone before moving on.**

---

## 2. Decisions (defaults — change only if the user says so)

| Decision | Default |
|---|---|
| Weight unit | kg (stored as kg; unit setting is a possible later addition) |
| Week start | Monday |
| Distribution | Expo Go during development; EAS build + TestFlight only if the user gets an Apple Developer account ($99/yr) |
| Backend / sync | None. Local-first, on-device SQLite |
| Accounts / auth | None |
| Language / strictness | TypeScript, `strict: true` |

---

## 3. Environment constraints (Windows + iPhone)

- Development happens on **Windows**. There is **no iOS Simulator**. Test on the user's iPhone with **Expo Go** (scan the QR code from `npx expo start`).
- Laptop and phone must be on the **same Wi-Fi**. If the QR connection fails, use `npx expo start --tunnel`.
- Expo Go must match the project's **Expo SDK version**. Use the SDK that the current App Store version of Expo Go supports; scaffold with `npx create-expo-app@latest`.
- Install native-dependent packages with **`npx expo install <pkg>`** (not `npm install`) so versions match the SDK.
- Packages used must work **inside Expo Go**. Do not add libraries that require a custom dev client unless the user agrees to move off Expo Go.
- Before using any Expo/React Native API, check the **current docs for the installed SDK version** (APIs such as `expo-sqlite` have changed between versions). Do not rely on memory.
- Shell: the user is on Windows. Provide commands that work in PowerShell and avoid Unix-only syntax in `package.json` scripts.

---

## 4. Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo + React Native, TypeScript (strict) |
| Navigation | Expo Router (file-based), bottom tabs |
| Storage | `expo-sqlite` (async API), on-device, with versioned migrations |
| State | React state + small hooks; Zustand only if cross-screen state becomes painful |
| Charts | `react-native-gifted-charts` (needs `react-native-svg`, `expo-linear-gradient`), or `victory-native` if gifted-charts has problems in Expo Go |
| Forms | Controlled inputs, own validation (pure functions) |
| Testing | Jest via `jest-expo`, plus `@testing-library/react-native` for key components |
| Lint / format | ESLint (`eslint-config-expo`) + Prettier |
| Export | `expo-file-system` + `expo-sharing` for CSV export |

Avoid heavy date libraries. Date logic is small and must be fully owned and tested (see Phase 1).

---

## 5. Domain rules (the source of truth)

These rules are implemented once, in `src/lib`, and used everywhere. Never re-implement them in UI code.

### 5.1 Entry
One logged exercise on one day:
- `exerciseName` (string, trimmed, 1–60 chars)
- `sets` (positive integer, 1–50)
- `reps` (positive integer, 1–1000) — reps **per set**
- `weightKg` (decimal ≥ 0, max 1000, or `null` if not entered)
- `date` (local calendar date string `YYYY-MM-DD`)

### 5.2 Dates
- Store workout dates as **plain local date strings `YYYY-MM-DD`**. Never store a timestamp for the workout date. This avoids timezone and daylight-saving bugs.
- Date arithmetic must be done on UTC-parsed dates (`Date.UTC(y, m-1, d)`) and formatted back to `YYYY-MM-DD`, never with local-time `new Date('YYYY-MM-DD')` parsing quirks.
- "Today" is derived from the device's local date at call time (inject it as a parameter into pure functions so they are testable).

### 5.3 Weeks
- A week runs **Monday to Sunday**.
- `weekStart(date)` returns the Monday on or before `date`. `weekEnd` is `weekStart + 6 days`.
- "Last week" = the week whose start is `thisWeekStart − 7 days`.
- Weeks are identified by their **start date**, never by week number. This makes month and year boundaries (and ISO week 53) a non-issue.

### 5.4 Metrics
For a set of entries:
- `totalSets = Σ sets`
- `totalReps = Σ (sets × reps)`
- `totalVolumeKg = Σ (sets × reps × (weightKg ?? 0))`
- `exerciseCount = number of entries`
- Blank weight counts as 0 for volume (bodyweight exercises add reps but no volume).

### 5.5 Comparison (this week vs last week)
- `percentChange(current, previous)`:
  - if `previous === 0` → return `null` (UI shows "No baseline", never divide by zero)
  - otherwise `round((current − previous) / previous × 100)`
- `trend(current, previous)` → `'up' | 'down' | 'same' | 'no-baseline'`
  - `no-baseline` when `previous === 0`
- Rounding: round half away from zero to a whole percent; display with a sign for positive values (e.g. `+12%`, `-5%`, `0%`).

### 5.6 Validation
Validation functions return a result object (`{ ok: true, value } | { ok: false, errors }`), not exceptions.
- Accept both `.` and `,` as decimal separator for weight (iPhone keyboards in some locales type `,`). Normalize before parsing.
- Reject `NaN`, negatives, zero for sets/reps, non-integers for sets/reps.
- Trim exercise names; collapse internal repeated whitespace; reject empty.
- Exercise name matching for autocomplete/history is **case-insensitive** on the trimmed name.

---

## 6. Data model

SQLite, single table for v1, versioned with `PRAGMA user_version`.

```sql
-- migration 1
CREATE TABLE entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_name TEXT    NOT NULL,
  sets          INTEGER NOT NULL CHECK (sets > 0),
  reps          INTEGER NOT NULL CHECK (reps > 0),
  weight_kg     REAL    CHECK (weight_kg IS NULL OR weight_kg >= 0),
  date          TEXT    NOT NULL,   -- 'YYYY-MM-DD' local date
  created_at    TEXT    NOT NULL    -- ISO timestamp, audit only
);
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_name ON entries(exercise_name COLLATE NOCASE);
```

Rules:
- Migrations are an **ordered array**; the runner applies those greater than `user_version` inside a transaction and bumps `user_version`. Never edit a shipped migration; add a new one.
- All DB access goes through a small repository module (`src/db/entries.ts`). UI code never writes SQL.
- Queries by week use `date BETWEEN weekStart AND weekEnd` (string comparison is correct for `YYYY-MM-DD`).
- Money-style rounding issues: weights are `REAL`; display with at most 2 decimals and trim trailing zeros. Do volume math in code, not SQL, so it matches the tested functions.

---

## 7. Folder structure

```
workout-tracker/
├─ app/                      # Expo Router screens
│  ├─ _layout.tsx            # root layout, DB provider, error boundary
│  ├─ (tabs)/
│  │  ├─ _layout.tsx         # bottom tabs
│  │  ├─ index.tsx           # Today / quick add
│  │  ├─ week.tsx            # Week view
│  │  ├─ progress.tsx        # Progress vs last week
│  │  └─ exercises.tsx       # Exercise list -> history
│  ├─ exercise/[name].tsx    # Exercise history & PBs
│  ├─ log.tsx                # modal sheet: add/edit entry (tab-bar "+")
│  └─ welcome.tsx            # first-launch splash (optional, see DESIGN.md)
├─ src/
│  ├─ lib/                   # PURE logic, fully unit tested
│  │  ├─ dates.ts
│  │  ├─ weeks.ts
│  │  ├─ metrics.ts
│  │  ├─ compare.ts
│  │  ├─ validation.ts
│  │  ├─ format.ts
│  │  └─ csv.ts
│  ├─ db/
│  │  ├─ migrations.ts
│  │  ├─ client.ts
│  │  └─ entries.ts          # repository
│  ├─ components/            # EntryForm, EntryRow, WeekStrip, StatCard, TrendBadge, charts...
│  ├─ hooks/                 # useEntries, useWeekSummary, ...
│  └─ theme/                 # colors, spacing, typography, dark mode
├─ __tests__/                # mirrors src/lib + db + key components
├─ docs/design/              # screens/*.png + source/*.dc.html (visual reference, see DESIGN.md)
├─ plan.md
├─ DESIGN.md                 # visual design: tokens, screens, component map
├─ ARCHITECTURE.md           # layers, data flow, ADRs
├─ CLAUDE.md                 # short rules distilled from this plan (Phase 0)
└─ package.json
```

---

## 8. Working rules for Claude Code

1. **Work one phase at a time.** At the end of each phase, run lint, type-check and tests, then stop and tell the user exactly how to verify on the iPhone.
2. **Pure logic first, UI second.** Write tests for `src/lib` before or together with the code.
3. **No business logic in components.** Components call `src/lib` and `src/db`.
4. **Check docs for the installed SDK** before using Expo / React Native APIs. Do not guess signatures.
5. **Use `npx expo install`** for Expo-managed packages.
6. **Never use `any`** or non-null assertions to silence the compiler. Fix types properly.
7. **Never store timestamps for workout dates** and never parse `YYYY-MM-DD` with `new Date(string)`.
8. **Confirm before destructive actions** in the UI (delete entry, clear data).
9. **Keep dependencies minimal.** Ask before adding a library not listed in section 4.
10. **Do not claim something works unless it was run.** Say what was tested (unit tests, type-check) versus what needs the user to check on the phone.
11. **Commit after each phase** with a clear message (`git init` in Phase 0).
12. Keep a short `CHANGELOG` section at the bottom of this file updated per phase.
13. **Read `ARCHITECTURE.md` and `DESIGN.md` before Phase 0.** Layer boundaries are enforced by lint; each screen is built to match its PNG in `docs/design/screens/` using tokens from `src/theme`.

Scripts to maintain in `package.json`:
- `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`jest`), and a combined `check` (`lint && typecheck && test`). Run `check` before ending every phase.

---

## 9. Phases

### Phase 0 — Setup (about 1 day)

**Goal:** a blank, strict, linted, tested app that opens on the iPhone.

Tasks:
- Install on the laptop: Node LTS, Git, VS Code. Install **Expo Go** on the iPhone.
- `npx create-expo-app@latest workout-tracker` (TypeScript template, Expo Router).
- Enable `"strict": true` in `tsconfig.json`.
- Configure ESLint (`eslint-config-expo`) and Prettier.
- **Configure lint import boundaries** (`no-restricted-imports` or `eslint-plugin-boundaries`, per `ARCHITECTURE.md` §2) and a rule banning `new Date(string)`. Add a deliberately violating file once to confirm `npm run check` fails, then remove it.
- Copy `DESIGN.md` and `docs/design/` into the repo; create `src/theme` tokens (colour, radius, spacing, type) from `DESIGN.md` §1.
- Set up Jest with `jest-expo`; add one trivial passing test.
- Add `typecheck`, `lint`, `test`, `check` scripts.
- Create the folder structure from section 7 (empty files are fine).
- Write a short `CLAUDE.md` distilling section 8 and the domain rules in section 5.
- `git init`, first commit.
- Set up bottom tabs with four placeholder screens (Today, Week, Progress, Exercises) using the custom tab bar with the centre "+" (opens placeholder `app/log.tsx` modal), per `DESIGN.md` §3.

Done when:
- `npm run check` passes and the boundary lint rule is proven to fail on a violation.
- `npx expo start` opens the app on the iPhone via Expo Go, all four tabs are reachable and the centre "+" opens the modal.

### Phase 1 — Foundation: database and pure logic

**Goal:** all rules from section 5 implemented and tested; database ready.

Tasks:
- **`src/lib/dates.ts`**
  - `parseLocalDate(s: string): {y, m, d}` — validates format and real calendar dates (rejects `2026-02-30`).
  - `toDateString({y, m, d})`, `todayLocal(now = new Date())`.
  - `addDays(dateStr, n)` (UTC-based arithmetic), `diffDays(a, b)`, `isValidDateString`.
- **`src/lib/weeks.ts`**
  - `weekStart(dateStr)` → Monday, `weekEnd(dateStr)` → Sunday.
  - `weekRange(dateStr)` → `{ start, end, days: string[7] }`.
  - `previousWeekStart(dateStr)`, `nextWeekStart(dateStr)`.
  - `formatWeekLabel(start)` → e.g. `Nov 16 – Nov 22`; includes the year when the range crosses a year boundary.
- **`src/lib/metrics.ts`**: `summarize(entries)` → `{ totalSets, totalReps, totalVolumeKg, exerciseCount }`.
- **`src/lib/compare.ts`**: `percentChange`, `trend`, `compareWeeks(current, previous)`.
- **`src/lib/validation.ts`**: `validateEntryInput(raw)` per section 5.6; `parseWeightInput` with `,`/`.` handling.
- **`src/lib/format.ts`**: `formatWeight`, `formatPercent`, `formatVolume`.
- **`src/db/migrations.ts` + `client.ts`**: migration runner using `PRAGMA user_version`, transactional.
- **`src/db/entries.ts`**: `addEntry`, `updateEntry`, `deleteEntry`, `getEntriesByDateRange`, `getEntriesByExercise`, `getDistinctExerciseNames`, `getLastEntryForExercise`.
- Check `expo-sqlite` docs for the installed SDK for the correct async API and provider setup.

Required unit tests (minimum):
- `weekStart` for every weekday, including a Sunday (belongs to the week that started the previous Monday) and a Monday.
- Week crossing a **month** boundary (e.g. Mon Mar 30 → Sun Apr 5) and a **year** boundary (e.g. Mon Dec 28 → Sun Jan 3).
- Leap day (Feb 29, 2028) and `2026-02-30` rejection.
- Daylight-saving transition weeks (e.g. around March and November) still produce exactly 7 distinct days.
- `previousWeekStart` across year boundaries.
- `summarize` with blank weights, decimal weights, many entries, and empty list (all zeros).
- `percentChange`: previous 0 → `null`; increase, decrease, no change; rounding cases (e.g. 0.5 rounds away from zero).
- `trend` for all four outcomes.
- Validation: valid input, empty name, whitespace-only name, sets 0 / negative / decimal, reps 0, weight `"42,5"` and `"42.5"`, weight negative, weight blank → `null`, absurdly large values rejected.
- Migration runner: fresh DB reaches latest version; re-running is a no-op.
- Repository tests against an in-memory or test SQLite where feasible (or a thin interface mocked consistently).

Done when:
- All tests above pass and `npm run check` is green.
- A temporary debug screen (removable) can insert and list entries on the phone, and data survives closing and reopening the app.

### Phase 2 — Logging

**Goal:** the user can quickly add, edit and delete entries.

Tasks:
- **Design:** build to `docs/design/screens/02-today.png` and `03-log-exercise.png` (`DESIGN.md` §2).
- **Today tab:** shows today's entries, the Mo–Su strip and the dark hero card with an "Add exercise" button.
- **`app/log.tsx`** modal sheet hosts the add/edit form.
- **`EntryForm`** component: exercise name (with autocomplete from `getDistinctExerciseNames`, case-insensitive), sets, reps, weight (optional), date (defaults to today; allow changing via a date picker — check Expo Go-compatible options, e.g. `@react-native-community/datetimepicker`).
- **Prefill:** when an existing exercise name is chosen, prefill sets/reps/weight from `getLastEntryForExercise`.
- Numeric keyboards: `inputMode`/`keyboardType` set appropriately; weight accepts `,` and `.`.
- Inline validation errors from `validateEntryInput`; Save disabled while invalid or while saving (prevents double-tap duplicates).
- **Edit** (tap an entry) and **delete** (swipe or button) with a **confirmation dialog**.
- Keyboard handling: `KeyboardAvoidingView` / scroll so the form is never covered; respect safe areas.
- Empty state for "no entries today".

Done when:
- User can add, edit and delete entries without crashes.
- Rapid double-tap on Save creates exactly one entry.
- Autocomplete is case-insensitive; prefill works.
- Component tests cover form validation messages and the save/disabled behavior.
- Verified on the iPhone.

### Phase 3 — Week view

**Goal:** browse any week and see entries per day.

Tasks:
- **Design:** build to `docs/design/screens/04-week.png`.
- **Week tab:** header with `formatWeekLabel`, previous/next week buttons, and a "This week" shortcut.
- Monday–Sunday strip; selected day highlighted; today marked.
- Per-day list of entries (exercise, sets × reps, weight, volume).
- Per-day and per-week totals using `summarize`.
- Days with no entries show a clear empty state. Rest days are valid, not errors.
- Tapping an entry opens the same edit flow as Phase 2.
- Data refreshes after add/edit/delete elsewhere (e.g. refetch on focus).

Done when:
- An entry logged for a given date appears under the right day in the right week, including around a month boundary and Sunday/Monday boundaries.
- Navigating several weeks back and forward is stable and correct.
- Verified on the iPhone.

### Phase 4 — Progress (this week vs last week)

**Goal:** show progress against the previous week, matching a hand calculation.

Tasks:
- **Design:** build to `docs/design/screens/05-progress.png`; the "worked example" fixture is exactly the numbers shown.
- **Progress tab:** stat cards for **exercises logged**, **total sets**, **total reps**, **total volume (kg)**, each with last week's value, percent change (`formatPercent`) and a **TrendBadge** (Up / Same / Down / No baseline).
- Overall status badge based on total reps (and show volume separately).
- Week selector so the user can compare any week with its previous week (default: current week).
- **Weekly chart:** bar/column chart of total reps and total volume per week for the last 8 weeks (toggle between reps and volume). Weeks with no data show as 0.
- Handle "no data at all" and "no last week" states gracefully (no NaN, no `Infinity`, no crashes).

Done when:
- For a seeded dataset, the displayed numbers equal a hand calculation (add a test with a fixed dataset and expected output for `compareWeeks`).
- Last week = 0 shows "No baseline".
- Chart renders in Expo Go on the iPhone with real data.

### Phase 5 — Exercise history

**Goal:** see progress per exercise.

Tasks:
- **Design:** build to `docs/design/screens/06-exercises.png` and `07-exercise-detail.png`.
- **Exercises tab:** searchable list of all exercises (case-insensitive), with last performed date.
- **Exercise detail:** history list (newest first), **personal bests** (max weight, max volume in a single entry, max reps in a single set), and a line chart of weight over time.
- Personal best logic lives in `src/lib/metrics.ts` with unit tests (ties, blank weights, single entry, empty history).
- Renaming an exercise: optional; if implemented, it updates all entries in one transaction and merges case-insensitively.

Done when:
- Personal bests are correct for a seeded dataset (unit tested).
- Chart and history match the logged data on the phone.

### Phase 6 — Hardening

> Also in this phase: design the undesigned states listed in `DESIGN.md` §3.4 (dark mode, delete confirmation, empty/error states) and wire the Today export button to CSV export.

**Goal:** remove rough edges and verify the edge-case checklist.

Tasks:
- Root **error boundary** with a friendly fallback screen.
- Consistent **empty states** and **loading states** on every screen.
- **Dark mode** support via the theme (check both appearances on every screen).
- **Accessibility:** labels on buttons/inputs, sufficient contrast, tap targets of at least 44pt, dynamic type does not break layouts.
- **CSV export** (`src/lib/csv.ts`, unit tested): header row, correct quoting/escaping of commas, quotes and newlines in exercise names; shared via `expo-sharing`. This is the user's backup, since deleting the app deletes the on-device data.
- Optional **CSV import** (strict validation, report invalid rows, never partially corrupt data).
- Performance pass: indexes used, lists virtualized (`FlatList`), no needless re-renders on large datasets (test with ~5,000 seeded entries).
- Review every screen for the checklist in section 10.

Done when:
- Section 10 checklist passes, verified on the iPhone.
- `npm run check` is green and the unit test suite covers all of `src/lib`.

### Phase 7 — Release

**Goal:** a build the user can live with.

Tasks:
- Set app name, slug, icon and splash in `app.json` (placeholder icon is fine).
- **Option A (free):** keep using Expo Go with `npx expo start`. Document this in a short `README.md`.
- **Option B ($99/yr Apple Developer account):** `npm i -g eas-cli`, `eas build:configure`, `eas build --platform ios --profile preview`, then submit to **TestFlight** with `eas submit`. No Mac is required. Walk the user through the Apple account steps, as they need the user's own credentials; never ask for or store their passwords.
- Write a `README.md`: how to run, how to run tests, how to back up (CSV export), how to build.
- One week of real use by the user; log issues; fix them in a final bug-fix pass.

Done when:
- The user has used the app for a full week of real workouts without data loss or crashes and all reported issues are resolved.

---

## 10. Edge-case checklist (verify in Phase 6, re-check after any change to dates/metrics)

**Dates and weeks**
- [ ] Logging on Sunday late night shows in the correct (current) week; Monday morning starts a new week.
- [ ] Week crossing a month boundary (e.g. Mar 30 – Apr 5) shows all days correctly.
- [ ] Week crossing New Year (e.g. Dec 28 – Jan 3) and ISO week 53 behave correctly.
- [ ] Leap day (Feb 29) can be logged and appears in the right week.
- [ ] Changing the device timezone or crossing DST does not move entries to another day.
- [ ] Editing an entry's date moves it to the right day/week.

**Metrics and comparison**
- [ ] First ever week: no last week → "No baseline", no NaN/Infinity.
- [ ] Last week had entries, this week has none → shows a drop of 100% (or "Down"), no crash.
- [ ] Blank weight: reps count, volume adds 0.
- [ ] Decimal weights (e.g. 22.5 kg) sum without visible floating-point noise (e.g. `0.1 + 0.2`).
- [ ] Percent change rounds correctly and shows signs correctly.

**Input**
- [ ] Weight typed with `,` is accepted.
- [ ] Zero, negative, decimal sets/reps are rejected with clear messages.
- [ ] Very long exercise names are truncated gracefully in lists but stored fully (up to 60 chars).
- [ ] Very large numbers rejected by validation, not stored.
- [ ] Names that differ only by case or extra spaces are treated as the same exercise.
- [ ] Rapid double-tap on Save creates one entry.

**UI**
- [ ] Keyboard never covers the focused input or Save button.
- [ ] Safe areas respected on notched iPhones.
- [ ] Dark mode readable on every screen.
- [ ] Delete always asks for confirmation.
- [ ] Offline use works (the app never needs network).
- [ ] Rotating or switching apps and returning preserves in-progress form text where reasonable.

**Data**
- [ ] Data survives closing and reopening the app and a full phone restart.
- [ ] A new migration applied on top of existing data keeps all entries (test with seeded data).
- [ ] CSV export opens correctly in a spreadsheet, with special characters intact.
- [ ] 5,000 entries: screens still open quickly and scroll smoothly.

---

## 11. Phase gate summary

| Phase | Gate (all must pass) |
|---|---|
| 0 Setup | `npm run check` green; app opens on iPhone with four tabs |
| 1 Foundation | All lib + DB tests green; data persists across app restarts |
| 2 Logging | Add/edit/delete work; no duplicate on double-tap; verified on phone |
| 3 Week view | Entries appear on correct days/weeks incl. boundaries |
| 4 Progress | Numbers match hand calculation; no-baseline handled; chart renders |
| 5 Exercise history | Personal bests tested and correct; charts match data |
| 6 Hardening | Section 10 checklist all ticked; CSV export verified |
| 7 Release | One week of real use without data loss or crashes |

---

## 12. Out of scope for v1 (do not build unless asked)

- Notion or any cloud sync, user accounts, or a backend.
- Rest timer, workout templates (Push/Pull/Legs), supersets, RPE, body measurements.
- Unit switching (lb), Android-specific polish, widgets, Apple Health integration.
- Social or sharing features.

If the user asks for any of these later, treat it as a new phase appended to this plan, with its own tasks, tests and "Done when" criteria.

---

## CHANGELOG

- 2026-11-18 · Phase 0 · Expo SDK 58 scaffold, boundary lint rules (proven to fail on violations), theme tokens, custom tab bar. Verified: `npm run check`, iOS bundle build; confirmed working on the iPhone by the user.
- 2026-11-18 · Phase 1 · `src/lib` (dates, weeks, metrics, compare, validation, format) and `src/db` (SqlExecutor, migrations, repository, expo-sqlite client); repository/migration tests run on real SQLite via `better-sqlite3` (approved devDependency). Verified: `npm run check` (145 tests incl. PRD §7.5 fixture; lib tests also run under New York/Auckland/Kolkata time zones). Confirmed working on the iPhone by the user (debug screen since removed).
- 2026-11-18 · Phase 2 · Today screen, `/log` add/edit sheet (`EntryForm`, autocomplete, prefill, date picker, delete confirmation), Welcome screen (flag in SQLite, migration 2), hooks (`useEntryForm`, `useTodayData`, `useEntryMutations`, `useRepositoryQuery`). Verified: `npm run check` (185 tests: form validation messages, Save disabled while invalid/saving, double-save guard shown to fail when removed, prefill/autocomplete, edit, delete confirmation, v1→v2 upgrade keeping data) and iOS bundle build. Confirmed working on the iPhone by the user.
- 2026-11-18 · Phase 3 · Week tab: prev/next week and "This week" shortcut, selectable Mon-Sun strip, per-day entries and stats, week totals card, rest-day empty states, tap entry to edit, live refresh. Verified: `npm run check` (206 tests: entries placed on the correct day/week across Sunday/Monday, month, New Year and leap-day boundaries; navigation stability; screen interactions; two deliberate code breaks were each caught by the tests) and iOS bundle build. Confirmed working on the iPhone by the user.
- 2026-11-18 · Phase 4 · Progress tab: overall status from total reps, four stat cards (this week, last week, percent change, trend badge), 8-week Reps/Volume bar chart (hand-drawn, no chart library), week selector with a "This week" shortcut, "No data yet" and "No baseline" states. Verified: `npm run check` (234 tests, including the PRD §7.5 numbers rendered exactly as in the design: Up 25%, +33/+30/+25/+8, chart bars 88/96/0/101/94/99/107/134; a deliberately wrong baseline week was caught by 11 failing tests) and iOS bundle build. iPhone check: pending.
