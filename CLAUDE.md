# CLAUDE.md — Workout Tracker

Personal workout tracking app: **Expo + React Native + TypeScript**, local-first (SQLite), for one user on an iPhone. Developed on **Windows**.

**Read first:** `PRD.md` (what to build and why), `plan.md` (phases, tasks, gates), `ARCHITECTURE.md` (layers, data flow, ADRs) and `DESIGN.md` (visual design, tokens, screens). This file is the short list of rules to follow while coding. If this file and the other docs ever conflict, stop and ask the user.

---

## Current status
- Phase: **1 — Foundation**: code complete, `npm run check` green (145 tests); **awaiting the user's iPhone check** of the temporary debug screen (Phase 0's iPhone check was not reported back before Phase 1 started). Remove `app/debug.tsx`, its Today-tab link and its `Stack.Screen` once Phase 1 is signed off. (update this line at the end of every phase)
- Work on **one phase at a time**. Do not start the next phase until the current phase's "Done when" checks in `plan.md` pass and the user has confirmed on the iPhone.

---

## Commands

```bash
npx expo start            # dev server (scan QR with Expo Go on iPhone)
npx expo start --tunnel   # if the phone can't reach the laptop over Wi-Fi
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm run test              # Jest (jest-expo)
npm run check             # lint + typecheck + test  <-- run before ending every phase
```

- Install Expo-managed packages with **`npx expo install <pkg>`** (never plain `npm install`) so versions match the SDK.
- The user is on **Windows/PowerShell**: no Unix-only commands or env-var syntax in `package.json` scripts.

---

## Environment constraints
- There is **no iOS Simulator**. The user tests on a real iPhone with **Expo Go**.
- Only use libraries that **work in Expo Go**. Do not add anything requiring a custom dev client or native config without asking.
- **Check the docs for the installed Expo SDK version** before using any Expo/React Native API (e.g. `expo-sqlite`'s async API and provider). Do not rely on memory for signatures.
- Installed: **Expo SDK 58** (React 19.3, RN 0.88, TypeScript 6). Verified facts: import `Tabs` from `expo-router/js-tabs` (the `expo-router` export is deprecated); a custom `tabBar` receives `{ state, descriptors, emitter, navigateToTab, insets }` (no `navigation`); `tsconfig` needs `"types": ["jest"]`; routes live in root `app/` (works alongside `src/`, no `src/app/`). `react-dom` is pinned to match `react` (19.3.0). Typed routes (`.expo/types`, gitignored) are regenerated only by the `expo start` dev server, so after adding a route run it once before `npm run typecheck`. `expo-sqlite` `withTransactionAsync` is not exclusive; fine here because writes are sequential, revisit if concurrent writers appear.

---

## Tech stack (do not add libraries beyond this without asking)
- Expo Router (file-based, bottom tabs) · TypeScript `strict`
- `expo-sqlite` for storage, with versioned migrations (`PRAGMA user_version`)
- React state + small hooks (Zustand only if truly needed)
- Charts: `react-native-gifted-charts` (+ `react-native-svg`, `expo-linear-gradient`); fallback `victory-native`
- Date picker: `@react-native-community/datetimepicker` (verify it works in Expo Go)
- Tests: Jest via `jest-expo`, `@testing-library/react-native`
- Lint/format: ESLint (`eslint-config-expo`) + Prettier
- CSV export: `expo-file-system` + `expo-sharing`
- **No** date library, backend, auth, analytics, or network calls.

---

## Project structure
```
app/                 Expo Router screens: _layout.tsx, (tabs)/{index,week,progress,exercises}.tsx, exercise/[name].tsx
src/lib/             PURE logic (dates, weeks, metrics, compare, validation, format, csv) — fully unit tested
src/db/              migrations.ts, client.ts, entries.ts (repository — the ONLY place with SQL)
src/components/      EntryForm, EntryRow, WeekStrip, StatCard, TrendBadge, charts, ...
src/hooks/           useEntries, useWeekSummary, ...
src/theme/           colors, spacing, typography, dark mode (tokens from DESIGN.md)
__tests__/           mirrors src/lib, src/db, key components
docs/design/         screens/*.png (visual reference) and source/*.dc.html (reference only, not shipped code)
```

Extra route from the design: `app/log.tsx` (modal sheet for adding/editing an entry, opened by the tab bar's centre "+"). See `DESIGN.md` §3.

---

## Domain rules (single source of truth — implement once in `src/lib`, never in UI code)

**Entry:** `exerciseName` (trimmed, collapsed whitespace, 1–60 chars), `sets` (int 1–50), `reps` per set (int 1–1000), `weightKg` (decimal 0–1000 or `null`), `date` (local `YYYY-MM-DD`).

**Dates**
- Store workout dates as plain `YYYY-MM-DD` strings. **Never store a timestamp for the workout date.**
- **Never** parse `YYYY-MM-DD` with `new Date(string)`. Use `Date.UTC(y, m-1, d)` for arithmetic and format back to a string.
- "Today" is passed into pure functions as a parameter (so tests are deterministic); only the app shell reads the device clock.
- Reject impossible dates (e.g. `2026-02-30`).

**Weeks:** Monday–Sunday, identified by start date (never by week number). Last week = week starting 7 days before this week's start. Month/year boundaries are handled by date arithmetic.

**Metrics:** `totalSets = Σ sets`, `totalReps = Σ sets×reps`, `totalVolumeKg = Σ sets×reps×(weightKg ?? 0)`, `exerciseCount = number of entries`. Blank weight = 0 for volume. Compute in code, not SQL.

**Comparison:** `percentChange = round((cur − prev)/prev × 100)` (round half away from zero); if `prev === 0` return `null` → UI shows "No baseline". **Never produce NaN or Infinity.** `trend` → `up | down | same | no-baseline`. Display percent with a sign (`+12%`, `-5%`, `0%`). Overall status is based on total reps.

**Validation:** return result objects (`{ok:true,value} | {ok:false,errors}`), not exceptions. Accept `.` and `,` as decimal separator for weight. Reject NaN, negatives, zero/decimal sets or reps, empty names. Exercise names match **case-insensitively** on the trimmed name.

**Worked example fixture** (PRD §7.5) — must be an automated test:
last week 3 exercises / 10 sets / 107 reps / 3,120 kg → this week 4 / 13 / 134 / 3,355 kg → changes +33%, +30%, +25%, +8%, all Up.

---

## Coding conventions
- TypeScript `strict`. **No `any`, no `// @ts-ignore`, no non-null `!` to silence the compiler.** Fix the types.
- **Layer boundaries are enforced by lint** (`ARCHITECTURE.md` §2): `src/lib` imports nothing from React, Expo or `src/db`; only `src/db` touches SQL/`expo-sqlite`; components and screens never import `expo-sqlite`. Also ban `new Date(string)` via lint. A violation fails `npm run check`; never disable the rule to get green.
- **UI follows `DESIGN.md`:** before building a screen, open its PNG in `docs/design/screens/` and match it. Use tokens from `src/theme`; no hard-coded colours, radii or font sizes in components. Anything not designed (dark mode, delete confirmation, empty/error states) uses the same tokens; ask if unsure.
- **No business logic in components.** Components call `src/lib` and `src/db`. No SQL outside `src/db/entries.ts`.
- Pure functions in `src/lib` take plain inputs and return plain outputs; no side effects, no clock reads.
- Small files, named exports, descriptive names. Co-locate component styles; shared tokens live in `src/theme`.
- Migrations are an ordered array; **never edit a shipped migration** — add a new one. Run inside a transaction.
- Use `FlatList` for long lists. Use `KeyboardAvoidingView`/scroll handling and safe areas on every form screen.
- Every interactive element gets an accessibility label and a tap target ≥ 44pt. Don't rely on color alone for meaning (use text/icons plus color).
- Dark mode via the theme, tested on every screen.
- Destructive actions (delete) **always** ask for confirmation.
- Prevent double-submit: disable Save while saving.
- Comments explain *why*, not *what*.

---

## Testing rules
- Write tests **before or together with** each `src/lib` function. Pure logic must have thorough unit tests.
- Minimum cases to cover (details in `plan.md` Phase 1): every weekday for `weekStart`; month, year, leap-day and DST-week boundaries; empty/blank-weight/decimal metrics; `percentChange` with previous = 0, rounding, increase/decrease/equal; validation of every field including `,` decimals; migration runner idempotence; CSV quoting/escaping.
- Component tests for the entry form (validation messages, disabled-while-saving) and key states (empty, no-baseline).
- `npm run check` must be green before declaring a phase complete.

---

## Workflow per phase
1. Re-read the phase in `plan.md` and the relevant PRD requirements (FR-x IDs).
2. Implement, writing tests alongside.
3. Run `npm run check`; fix everything.
4. Tell the user **exactly how to verify on the iPhone** (what to tap, what they should see).
5. Update the "Current status" line here and the CHANGELOG at the bottom of `plan.md`.
6. Commit with a clear message (e.g. `phase-1: dates, weeks, metrics, db layer`).
7. **Stop and wait** for the user's go-ahead before the next phase.

---

## Honesty rules
- **Never claim something works unless it was actually run.** State clearly what was verified (unit tests, type-check, lint) versus what only the user can verify on the phone.
- Don't promise "bug-free". Say which checks passed and which edge cases are covered.
- If a library doesn't work in Expo Go, say so and propose the fallback instead of working around it silently.
- If a requirement is unclear or conflicts with another, ask rather than guess.

---

## Safety rules
- Never ask for, store, or write the user's Apple ID, passwords, API keys, or tokens into files or code.
- No network calls, telemetry, or third-party SDKs that send data off the device.
- Don't delete or overwrite user data/files without confirmation. Don't run destructive git commands (`reset --hard`, force push) without asking.
- Release steps (Apple Developer account, `eas build`, `eas submit`) are done by the user with their own credentials; Claude only provides instructions.

---

## Out of scope for v1 (do not build unless the user asks)
Cloud sync, accounts, Notion sync, rest timer, templates (Push/Pull/Legs), supersets, RPE, body measurements, lb/kg switching, Android polish, widgets, Apple Health, social features. If requested later, add it as a **new phase** in `plan.md` with tasks, tests and "Done when" criteria.

---

## Defaults (change only if the user says so)
kg only · week starts Monday · Expo Go during development · no backend · no accounts · TypeScript strict.
