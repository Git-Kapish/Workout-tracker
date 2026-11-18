# Workout Tracker — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Workout Tracker (working title) |
| **Platform** | iPhone (iOS), built with Expo / React Native |
| **Owner / user** | Kapish (single user, personal app) |
| **Status** | Draft v1.0 — ready for Phase 0 |
| **Companion docs** | `plan.md` (phased implementation plan), `CLAUDE.md` (rules for Claude Code) |

---

## 1. Overview

### 1.1 Problem
The user currently tracks workouts in a Notion workspace (Workout Log + Weekly Progress databases). It works, but logging on a phone is slow, week assignment is manual (the user must pick the week for every row), and the "vs last week" comparison depends on hand-maintained links between weeks.

### 1.2 Solution
A fast, offline, iPhone-first app where the user logs an exercise in a few taps and instantly sees:
- what they did each day of any week,
- how this week compares with last week,
- how each exercise is progressing over time.

Weeks are derived automatically from the workout date. "Last week" is simply the previous calendar week. No manual linking, no setup.

### 1.3 Goals
1. **Log an exercise in under 10 seconds** for a repeated exercise (prefill from last session).
2. **Always-correct numbers.** Weekly totals and percent changes match a hand calculation, including month/year boundaries.
3. **Works fully offline** with data safely stored on the device.
4. **Zero-surprise data handling:** no silent data loss, easy CSV backup.
5. **Simple enough to finish.** v1 is deliberately small.

### 1.4 Non-goals (v1)
- Cloud sync, accounts, or a backend.
- Notion sync (the app replaces the Notion tracker; a one-way import/export can be considered later).
- Rest timer, workout templates, supersets, RPE, body measurements, photos.
- lb/kg switching (kg only in v1), Android polish, widgets, Apple Health, social features.

### 1.5 Success criteria
- The user logs all of their real workouts in the app for **one full week** without data loss, crashes, or reverting to Notion.
- For a seeded test dataset, every displayed total and percentage equals the hand-calculated value.
- All unit tests and the Phase 6 edge-case checklist (see `plan.md`) pass.

---

## 2. User

**Single user: Kapish** — comfortable with TypeScript, React Native and Expo. Trains regularly (strength / bodybuilding style), logs exercises as sets × reps at a weight. Develops on **Windows**, uses an **iPhone** for testing and daily use. Wants a structured, visual presentation of information.

Implications:
- No onboarding, tutorials, or sign-in needed.
- Developer-friendly: readable code, tests, scripts.
- Dense, scannable UI is welcome; it is a personal tool, not a mass-market product.

---

## 3. Core concepts and definitions

| Term | Definition |
|---|---|
| **Entry** | One logged exercise on one date: name, sets, reps per set, optional weight (kg), date |
| **Sets** | Number of sets performed (positive integer) |
| **Reps** | Repetitions **per set** (positive integer) |
| **Weight** | kg used per set (decimal ≥ 0, optional) |
| **Total reps** | `sets × reps` for an entry; summed across entries for a period |
| **Volume** | `sets × reps × weight` (blank weight counts as 0); summed across entries for a period |
| **Week** | Monday–Sunday, identified by its Monday (start date) |
| **This week / Last week** | Week containing today / the week starting 7 days earlier |
| **Exercises logged** | Number of entries in a period |
| **Trend** | Up / Same / Down / No baseline, from comparing a metric with last week's |

---

## 4. User stories

### Logging
- **US-1** As a user, I can add an entry with exercise name, sets, reps and weight so my workout is recorded.
- **US-2** As a user, I get autocomplete for exercise names I've used before, so I don't retype and don't create duplicates like "Bench press" vs "bench press".
- **US-3** As a user, when I pick a previous exercise, sets/reps/weight are prefilled from my last session so repeating a workout is fast.
- **US-4** As a user, I can log for today by default or choose another date (e.g. to backfill yesterday).
- **US-5** As a user, I can edit or delete an entry, with a confirmation before deleting.

### Week view
- **US-6** As a user, I can see a Monday–Sunday strip for the current week with the entries for each day.
- **US-7** As a user, I can move to previous/next weeks and jump back to "This week".
- **US-8** As a user, I see per-day and per-week totals (sets, reps, volume).

### Progress
- **US-9** As a user, I can see this week vs last week for exercises logged, total sets, total reps and total volume, with the percent change.
- **US-10** As a user, I see a clear Up / Same / Down badge, and "No baseline" when last week had no data.
- **US-11** As a user, I can see a chart of the last 8 weeks (reps or volume) to see the longer trend.
- **US-12** As a user, I can pick any week and compare it with the week before.

### Exercise history
- **US-13** As a user, I can browse all my exercises and search them.
- **US-14** As a user, I can open an exercise and see its history, personal bests, and a weight-over-time chart.

### Data safety
- **US-15** As a user, I can export all my data as a CSV file as a backup.
- **US-16** As a user, my data persists across app restarts, phone restarts and app updates.

---

## 5. Functional requirements

Priority: **P0** = must have for v1, **P1** = should have, **P2** = nice to have.

### 5.1 Logging

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Add entry form with fields: exercise name, sets, reps, weight (optional), date | P0 |
| FR-2 | Date defaults to today (device local date); user can change it with a date picker | P0 |
| FR-3 | Exercise name autocomplete from previously used names, case-insensitive match | P0 |
| FR-4 | Selecting an existing exercise prefills sets/reps/weight from its most recent entry | P0 |
| FR-5 | Validation per rules in section 7; inline error messages; Save disabled while invalid or saving | P0 |
| FR-6 | Weight input accepts both `.` and `,` as the decimal separator | P0 |
| FR-7 | Edit an existing entry (all fields, including date) | P0 |
| FR-8 | Delete an entry with a confirmation dialog | P0 |
| FR-9 | Saving twice rapidly never creates duplicate entries | P0 |
| FR-10 | After saving, the form resets (keeping the date) so the next exercise can be added quickly | P1 |
| FR-11 | "Repeat" action on an entry to log the same exercise again with the same values | P2 |

### 5.2 Week view

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | Show the selected week (Mon–Sun) with a label such as `Nov 16 – Nov 22` (year shown if the range crosses a year boundary) | P0 |
| FR-13 | Day strip highlights today and the selected day; tapping a day shows its entries | P0 |
| FR-14 | Each entry row shows exercise name, `sets × reps`, weight, and volume | P0 |
| FR-15 | Per-day totals and per-week totals (sets, reps, volume, exercises logged) | P0 |
| FR-16 | Previous week / next week / "This week" controls | P0 |
| FR-17 | Empty states for days or weeks with no entries (rest days are normal) | P0 |
| FR-18 | Tapping an entry opens edit | P0 |

### 5.3 Progress

| ID | Requirement | Priority |
|---|---|---|
| FR-19 | Stat cards for exercises logged, total sets, total reps, total volume — each showing this week, last week, percent change and a trend badge | P0 |
| FR-20 | Percent change is `null` (shown as "No baseline") when last week's value is 0; never NaN or Infinity | P0 |
| FR-21 | Overall status badge (Up / Same / Down / No baseline) based on total reps | P0 |
| FR-22 | Week selector: compare any week with its previous week (default: current week) | P1 |
| FR-23 | Column chart of the last 8 weeks, toggle between total reps and total volume; weeks with no data show 0 | P0 |

### 5.4 Exercise history

| ID | Requirement | Priority |
|---|---|---|
| FR-24 | Exercises list with search, showing last-performed date | P0 |
| FR-25 | Exercise detail: history (newest first) | P0 |
| FR-26 | Personal bests: max weight, max single-entry volume, max reps in a single set | P1 |
| FR-27 | Line chart of weight over time for the exercise | P1 |
| FR-28 | Rename an exercise across all entries (case-insensitive merge) | P2 |

### 5.5 Data and settings

| ID | Requirement | Priority |
|---|---|---|
| FR-29 | All data stored locally in SQLite; no network required | P0 |
| FR-30 | Schema is versioned with migrations; updates never wipe data | P0 |
| FR-31 | Export all entries to CSV and share via the iOS share sheet | P1 |
| FR-32 | Import from CSV with strict validation and a per-row error report | P2 |
| FR-33 | Dark mode follows the system appearance | P1 |

---

## 6. Screens and UX

Bottom tab navigation with four tabs.

### 6.1 Today (home)
- Header: today's date and today's totals.
- **Add entry form** at the top (name with autocomplete, sets, reps, weight, date, Save).
- List of today's entries (tap to edit, swipe/button to delete).
- Empty state: "No exercises logged today."

### 6.2 Week
- Header: week label with previous / next buttons and a "This week" button.
- Monday–Sunday day strip (today marked, selected day highlighted, dot for days with entries).
- Selected day's entries below, with day totals.
- Footer card: week totals.

### 6.3 Progress
- Week selector (default current week), label showing "vs previous week".
- Four stat cards (exercises, sets, reps, volume): this week, last week, `+12%` style change, trend badge.
- Chart: last 8 weeks, toggle Reps / Volume.
- Empty states: "No data yet" and "No baseline" handled per card.

### 6.4 Exercises
- Search box and list of exercises (last performed date).
- Detail screen: personal bests, weight-over-time chart, history list.

### 6.5 UX principles
- **Fast first:** most common action (log a repeated exercise) is at most 3 taps.
- **Numeric keyboards** for sets, reps, weight.
- **Never lose typed input** on accidental navigation where reasonable.
- **Confirm destructive actions.**
- **Respect iOS conventions:** safe areas, large tap targets (≥ 44pt), system dark mode, dynamic type tolerance.
- **Visual and structured:** cards, badges, color-coded trends (green up, red down, gray same) — but never rely on color alone (also use text/icons).

---

## 7. Business rules and validation

### 7.1 Entry fields
| Field | Rule |
|---|---|
| Exercise name | Trimmed, internal whitespace collapsed, 1–60 chars; matching is case-insensitive |
| Sets | Integer, 1–50 |
| Reps | Integer, 1–1000 (per set) |
| Weight (kg) | Decimal 0–1000 or empty (`null`); `,` accepted as decimal separator; displayed with up to 2 decimals, trailing zeros trimmed |
| Date | Real calendar date, stored as local `YYYY-MM-DD` string |

### 7.2 Weeks
- Monday–Sunday; a week is identified by its start date.
- Last week = week starting 7 days before this week's start.
- Month and year boundaries are handled by date arithmetic, not week numbers.

### 7.3 Metrics
- `totalSets = Σ sets`
- `totalReps = Σ (sets × reps)`
- `totalVolumeKg = Σ (sets × reps × (weightKg ?? 0))`
- `exerciseCount = number of entries`

### 7.4 Comparison
- `percentChange = round((current − previous) / previous × 100)`; if `previous = 0` → no baseline (`null`).
- Trend: `up` if current > previous, `down` if lower, `same` if equal, `no-baseline` if previous = 0.
- Percent displays with a sign for positive values (`+12%`, `-5%`, `0%`).
- Overall status uses total reps; volume trend is displayed separately.

### 7.5 Worked example (used as a test fixture)
Last week (Mon Nov 9 – Sun Nov 15):
- Bench Press: 3 × 10 @ 40 kg → reps 30, volume 1,200
- Squat: 4 × 8 @ 60 kg → reps 32, volume 1,920
- Push-ups: 3 × 15 @ none → reps 45, volume 0

Totals: exercises 3, sets 10, reps 107, volume 3,120.

This week (Mon Nov 16 – Sun Nov 22):
- Bench Press: 3 × 10 @ 42.5 kg → reps 30, volume 1,275
- Squat: 4 × 8 @ 65 kg → reps 32, volume 2,080
- Push-ups: 3 × 18 @ none → reps 54, volume 0
- Pull-ups: 3 × 6 @ none → reps 18, volume 0

Totals: exercises 4, sets 13, reps 134, volume 3,355.

Expected comparison:
| Metric | This | Last | Change | Trend |
|---|---|---|---|---|
| Exercises | 4 | 3 | +33% | Up |
| Sets | 13 | 10 | +30% | Up |
| Reps | 134 | 107 | +25% | Up |
| Volume (kg) | 3,355 | 3,120 | +8% | Up |

(Percentages: 1/3 = 33.3 → 33; 3/10 = 30; 27/107 = 25.2 → 25; 235/3120 = 7.5 → 8.)

---

## 8. Data model

Single table for v1 (`entries`), versioned via `PRAGMA user_version`.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `exercise_name` | TEXT NOT NULL | stored trimmed; matched `COLLATE NOCASE` |
| `sets` | INTEGER NOT NULL | `> 0` |
| `reps` | INTEGER NOT NULL | `> 0`, per set |
| `weight_kg` | REAL NULL | `NULL` or `>= 0` |
| `date` | TEXT NOT NULL | local `YYYY-MM-DD` |
| `created_at` | TEXT NOT NULL | ISO timestamp, audit only |

Indexes: `date`, and `exercise_name COLLATE NOCASE`.

Derived values (volume, weekly totals, comparisons) are **computed in code** by tested pure functions, not stored and not computed in SQL.

### CSV format (export)
Header: `date,exercise,sets,reps,weight_kg`
- One row per entry, ordered by date then id.
- Fields containing commas, quotes or newlines are quoted per RFC 4180; quotes are doubled.
- Empty weight is an empty field.
- UTF-8 encoded.

---

## 9. Technical approach (summary)

Full detail in `plan.md`; key points:

- **Expo + React Native + TypeScript (strict)**, Expo Router with bottom tabs.
- **expo-sqlite** for on-device storage with a migration runner.
- **Pure logic in `src/lib`** (dates, weeks, metrics, compare, validation, format, csv) with comprehensive unit tests (Jest via `jest-expo`).
- **Repository layer** (`src/db/entries.ts`) is the only place that touches SQL.
- **Charts:** `react-native-gifted-charts` (fallback `victory-native`).
- **Development on Windows, testing on iPhone via Expo Go** (no iOS Simulator available). Tunnel mode if LAN connection fails.
- **Distribution:** Expo Go for development; EAS Build + TestFlight if the user obtains an Apple Developer account.

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| **Correctness** | All date/week/metric logic covered by unit tests, including month, year, leap-day and daylight-saving cases |
| **Performance** | Screens open in < 300 ms and scroll smoothly with ~5,000 entries; indexed queries; virtualized lists |
| **Offline** | 100% functional with no network |
| **Reliability** | No crash on empty data, huge values, or rapid taps; global error boundary with a friendly fallback |
| **Data safety** | Transactional migrations; confirmation on delete; CSV export as backup |
| **Privacy** | All data stays on the device; no analytics, no network calls, no accounts |
| **Accessibility** | Labels on controls, ≥ 44pt tap targets, readable contrast in light and dark mode, tolerates larger text sizes |
| **Maintainability** | Strict TypeScript, no `any`, lint/format enforced, clear folder structure |

---

## 11. Edge cases (must be handled)

- Logging late Sunday night vs early Monday morning (week assignment by the entry's date, not time).
- Week crossing a month boundary or New Year; ISO week 53; leap day.
- Device timezone change or DST: entries must not move to another day (dates are plain strings).
- First ever week: no last week → "No baseline".
- Last week had data, this week none → shows a 100% decrease / Down.
- Blank weight → reps count, volume adds 0.
- Floating-point noise in decimal weights (e.g. `0.1 + 0.2`) must not leak into the UI.
- Names differing only by case/spacing are the same exercise.
- Very long names, very large numbers, pasted text in numeric fields.
- Keyboard covering inputs; notches/safe areas; dark mode.
- Editing an entry's date moves it to the correct day/week.
- App killed mid-save: either the entry is fully saved or not at all.

---

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Date/week bugs (timezone, DST, boundaries) | Wrong totals — core trust issue | Plain `YYYY-MM-DD` strings, UTC-based arithmetic, injected "today", boundary unit tests |
| Library not compatible with Expo Go (charts, date picker) | Blocks a phase | Verify in the docs for the installed SDK; use fallback libraries; keep UI behind small wrapper components |
| Expo SDK / Expo Go version mismatch | App won't open on iPhone | Scaffold with latest SDK matching the App Store Expo Go; use `npx expo install` |
| No iOS Simulator on Windows | Slower UI iteration | Test on the real iPhone after each phase; use `--tunnel` if Wi-Fi blocks LAN |
| Data loss (app deleted, phone lost) | User loses history | CSV export (P1); optionally remind to export periodically |
| Scope creep | v1 never finishes | Non-goals list; extras only as new phases appended to `plan.md` |
| Claiming "bug-free" without proof | False confidence | Phase gates, tests, edge-case checklist; report only what was actually run |
| Expo Go can't be a permanent install | App unavailable without laptop | Decide on $99 Apple Developer account + TestFlight at Phase 7 |

---

## 13. Milestones (maps to `plan.md`)

| Phase | Deliverable |
|---|---|
| 0 | Setup — blank strict app opens on iPhone with four tabs |
| 1 | Foundation — database, migrations, tested pure logic |
| 2 | Logging — add / edit / delete with prefill and autocomplete |
| 3 | Week view — browse weeks, per-day entries and totals |
| 4 | Progress — this week vs last week, trend badges, 8-week chart |
| 5 | Exercise history — list, personal bests, weight chart |
| 6 | Hardening — empty/error states, dark mode, accessibility, CSV export, edge-case checklist |
| 7 | Release — Expo Go docs or TestFlight build; one week of real use |

Estimate: about 2–3 weeks part-time.

---

## 14. Acceptance criteria (v1 release)

1. All P0 requirements in section 5 are implemented; P1 items are implemented or explicitly deferred.
2. The worked example in section 7.5 produces exactly the expected results (covered by an automated test).
3. `npm run check` (lint + typecheck + tests) is green.
4. The Phase 6 edge-case checklist in `plan.md` is fully ticked, verified on the iPhone.
5. The app runs fully offline and data survives app and phone restarts.
6. CSV export opens correctly in a spreadsheet, including exercise names with commas or quotes.
7. The user completes one real week of workouts using only this app.

---

## 15. Open questions

| # | Question | Default until answered |
|---|---|---|
| 1 | Should weight support lb as a setting? | No — kg only in v1 |
| 2 | Monday or Sunday as week start? | Monday |
| 3 | Get an Apple Developer account ($99/yr) for a permanent install? | Not yet — Expo Go; decide at Phase 7 |
| 4 | Should bodyweight exercises optionally use the user's bodyweight in volume? | No — blank weight = 0 volume |
| 5 | Should the app import the existing Notion data? | Not in v1; CSV import (P2) could cover it later |
