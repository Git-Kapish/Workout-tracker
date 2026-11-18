# DESIGN.md — Workout Tracker ("Tally") UI handoff

Visual design for the app, derived from the Luma-style references (pastel gradients, white cards, one dark hero card, black pill buttons, centre "+" tab bar).

**How to use this file**
- Screenshots of every screen: `docs/design/screens/*.png` (390×844 pt, @2x). **Look at the matching PNG before building each screen and compare your result against it.**
- Exact source markup: `docs/design/source/*.dc.html`. These are plain HTML with inline styles, readable for exact sizes and spacing. They are **reference only**, not code to ship. Translate: `div`→`View`, text→`Text`, CSS gradient→`expo-linear-gradient`, inline `svg`→`react-native-svg`, `px`→dp.
- Tokens below go in `src/theme`. **No hard-coded colours, radii or font sizes in components.**
- All data shown in the mockups is the PRD §7.5 worked example, so the design doubles as a visual test fixture.

## 1. Design tokens

### Colour
| Token | Value | Use |
|---|---|---|
| `bg` | `#F3F3F5` | Screen background |
| `surface` | `#FFFFFF` | Cards, tab bar, sheets |
| `ink` | `#141414` | Primary text, black pill buttons, current-week bar, selected-day border |
| `inkMuted` | `#6B6B73` | Secondary text, inactive tab labels, captions |
| `inkSoft` | `#4A4A55` | Text on pastel gradient |
| `fieldBg` | `#F0F0F3` | Input fields, inactive chips, segmented-control track |
| `hairline` | `#ECECF0` | Chart gridlines |
| `placeholder` | `#C4C4CC` | Disabled / placeholder |
| `accent` | `#4F63F5` | Icons, chart line, links |
| `accentTint` | `#EEF0FF` | Icon tile backgrounds |
| `barPast` | `#7C86E8` | Past-week bars |
| `trendUpBg` / `trendUpFg` | `#E3F4EA` / `#1E7B4B` | "Up" badge |
| `heroFrom` / `heroTo` | `#3B3B42` / `#111113` | Dark hero card (radial, origin bottom-left; 58–60% stop) |
| `onHeroMuted` | white at ~65% opacity | Secondary text on hero |
| gradient text | `#4F63F5 → #D63F95 → #E8651F` (90°) | "counted." on Welcome only |
| splash gradient | `#DCEBFA → #FBE9EF (48%) → #FFF6EF (72%) → #FFFFFF` | Welcome background |
| sheet backdrop | `#CFE3F5 → #F3D7E5 (55%) → #FBE3D2` at 160° | Behind the Log sheet |

Trend colours (`down`, `same`, `no-baseline`) are **not designed yet**. Derive them in the theme: `down` = a red pair (tint bg, dark fg), `same` / `no-baseline` = `fieldBg` with `inkMuted`. Every badge always carries an **arrow/word plus the percentage**, never colour alone.

### Typography (Inter 400/500/600/700; use `@expo-google-fonts/inter` only if approved, otherwise system font)
| Role | Size / weight | Notes |
|---|---|---|
| Screen title | 20 / 600, −0.01em | lower-case with full stop: "good evening.", "exercises.", "progress." |
| Display (Welcome, sheet date) | 36 / 700, −0.03em | |
| Hero number | 28–32 / 700, −0.02em | "Up 25%" |
| Sheet title | 26 / 700, −0.02em | |
| Stat number | 22–24 / 700 | |
| Row title | 16 / 600 | Exercise name |
| Body / row detail | 13–15 / 400–500, `inkMuted` | |
| Caption | 11–12 / 500 | Tab labels 11 |
| Eyebrow | 11 / 600, +0.14em, UPPERCASE, `inkMuted` | "TODAY'S LOG", "HISTORY", "WEEK TOTALS" |

### Shape, spacing, elevation
- Radii: cards **22**, large cards/hero/chart card **28**, sheet top **36**, inputs **16**, chips and pill buttons **full (height/2)**, icon tiles **14**, history rows **18**.
- Screen side padding **20**; section gap 12–16; list-row gap 6–8.
- Tap targets **≥ 44**. Primary pill buttons 56 high. Inputs 56 (name) / 64 (numeric).
- Tab bar: **92 high** including safe-area bottom, white, top radius 28, shadow `0 -6 24 rgba(20,20,30,.06)`. Items 64×56. Centre "+" is a **56 black circle**. Active tab: `ink` colour + 600 weight; inactive `inkMuted` + 500.
- Icons: 24 px stroke icons, stroke 1.8, round caps/joins (Lucide-style). No emoji. Do not draw a fake status bar; the real one comes from the device.

## 2. Screens

| # | Screen | Route (see §3) | PNG | Notes |
|---|---|---|---|---|
| 1 | Welcome | `app/welcome.tsx` (first launch only) | `01-welcome.png` | Splash, no sign-in (the app has no accounts). Gradient background, two orbit rings, centre badge, four icon tiles, wordmark "tally", headline "Every rep, **counted.**", black "Get started" pill → Today. Show once. Persisting the "seen" flag needs a storage choice (e.g. a settings row in the existing SQLite database): ask the user before adding it. |
| 2 | Today | `app/(tabs)/index.tsx` | `02-today.png` | Header: date pill, greeting, export button. Mo–Su strip (today selected, dot = has entries). Dark hero card: "N exercises logged so far" + "Add exercise" pill. "TODAY'S LOG" list of entry rows (icon tile, name, `4 × 8 · 65 kg`, reps and volume on the right). Week summary row with trend badge. |
| 3 | Log exercise | `app/log.tsx` (modal, presented over tabs) | `03-log-exercise.png` | Bottom sheet over pastel backdrop. Fields: Exercise (+ suggestion chips from `getDistinctExerciseNames`), Sets, Reps per set, Weight (kg), Date row. Prefilled from last entry of that exercise. "Save exercise" pill, close ×, helper text "Sets 1–50 · Reps 1–1000 · Weight accepts . or ,". Opened by the tab-bar "+" and the hero button. |
| 4 | Week | `app/(tabs)/week.tsx` | `04-week.png` | Prev/next arrows + "Nov 16 – Nov 22 / This week". Mo–Su strip, selected day has a 1.5 `ink` border. Day heading + `2 exercises · 7 sets · 50 reps`. Entry rows. Dark "WEEK TOTALS" card: exercises / sets / reps / kg volume. Empty day: "Nothing logged yet" (past/future) or "Rest day". |
| 5 | Progress | `app/(tabs)/progress.tsx` | `05-progress.png` | Prev/next week arrows with `Nov 16 – Nov 22 vs Nov 9 – Nov 15`. Dark hero "Up 25%" + status badge (overall = total reps). 2×2 stat cards (Exercises, Sets, Reps, Volume) each with value, "last week N", trend badge `↑ +33%`. 8-week bar chart, Reps/Volume segmented toggle, current week bar `ink`, past bars `barPast`, value labels above bars, zero weeks show a stub bar + "0". |
| 6 | Exercises | `app/(tabs)/exercises.tsx` | `06-exercises.png` | Title, pill search field (case-insensitive filter), "6 EXERCISES" eyebrow, rows: icon tile, name, "Last done Nov 16", "Best 42.5 kg" (bodyweight exercises show best reps e.g. "6 reps"), chevron. |
| 7 | Exercise detail | `app/exercise/[name].tsx` | `07-exercise-detail.png` | Back button, title. Three PB cards: MAX WEIGHT, BEST VOLUME (single entry), MAX REPS/SET. Weight-over-time line chart (`accent` line, hollow points, latest point `ink`). HISTORY rows (date, `3 × 10 · 42.5 kg`, volume), newest first. |

## 3. Differences between this design and `plan.md` (resolve as follows)

1. **Add-entry is a modal sheet, not an inline form on Today.** Add `app/log.tsx` as a modal route; the tab bar's centre "+" is **not a tab**, it pushes `/log`. Phase 2's `EntryForm` is rendered inside this sheet. Today keeps the hero card with an "Add exercise" button. Edit reuses the same route with an entry id.
2. **Custom tab bar.** Four real tabs (Today, Week, Progress, Exercises) with the "+" in the middle slot. Implement with Expo Router `Tabs` and a custom `tabBar` component, or a custom `tabBarButton` for the middle slot. Check the installed SDK docs.
3. **Welcome screen** is new (not in `plan.md`). Build it in Phase 2 or later and treat it as optional polish.
4. **Not designed yet** (build to these rules; if unsure, ask): dark mode, edit/delete UI and the delete confirmation, loading and error states, empty Today / empty Progress / "No baseline" card states, date picker, CSV export button, keyboard-open layout of the sheet. Reuse the tokens above; add dark-mode values in `src/theme` and check every screen in both.
5. The mockup's Today header shows an **export** icon button; it is wired in Phase 6 (CSV export), a no-op placeholder before then should not be shown.
6. Mockups are interactive prototypes in HTML; ignore their `onClick`/state logic. Real behaviour comes from `PRD.md` and `plan.md`.

## 4. Component map (build these in `src/components`)

`TabBar`, `ScreenHeader`, `DayStrip` (shared by Today and Week), `EntryRow`, `HeroCard` (dark gradient, used on Today/Progress/Week totals), `StatCard`, `TrendBadge`, `SegmentedToggle`, `WeekBarChart`, `WeightLineChart`, `PbCard`, `ExerciseRow`, `SearchField`, `EntryForm` (+ `SuggestionChips`), `PillButton` (primary black / secondary), `IconTile`.

Charts: the bar chart and line chart are simple enough that `react-native-gifted-charts` should match the screenshots; if it cannot, draw them with `react-native-svg` (already in the stack) rather than adding a library.

## 5. Visual acceptance checklist (per screen, on the iPhone)

- Matches the PNG at a glance: spacing, radii, weights, colours from tokens.
- Long exercise names truncate with an ellipsis, never push the right-hand numbers off screen.
- Numbers use thousands separators (`3,355`), weights drop trailing zeros (`65 kg`, `42.5 kg`).
- Dynamic Type / larger text does not break rows (test one step up).
- Safe areas respected: tab bar sits above the home indicator; sheet respects the keyboard.
- All tap targets ≥ 44 pt and every control has an accessibility label.

## 6. Decisions for the states the mockups don't cover (made in Phase 6)

Built from the tokens above; review these on the phone and change them in `src/theme` or the named component.

| State | Decision | Where |
|---|---|---|
| **Dark mode** | Follows the system appearance. Near-black `bg #0E0E10`, `surface #1A1A1E`, light `ink #F4F4F6`; the accent lightens to `#7B8BFF`; trend badges use dark tints with light foregrounds. The dark hero card is unchanged (it is already dark). Every text/background pair the app uses is checked against WCAG 4.5:1 (3:1 for icons and chart marks) in both appearances by `__tests__/theme/contrast.test.ts`. | `src/theme/colors.ts` |
| **Small accent text** | `accent #4F63F5` is only 4.27:1 on the grey screen background, so links and today's day number use the slightly darker `accentText #3F51E0`. Icons, chart marks and selection tint keep the design's exact accent. | `src/theme/colors.ts` |
| **Welcome screen** | A fixed pastel scene: always light, dark status-bar text, even in dark mode. The whole screen is wrapped in `ForceLightTheme`, so shared components (the black "Get started" button) also use the light palette. | `app/welcome.tsx`, `src/theme/index.tsx`, `src/theme/welcome.ts` |
| **Buttons on the hero card** | The "Add exercise" pill is white with a dark label in both appearances; its label uses the hero card's own dark colour, not the theme ink (which turns near-white in dark mode). | `src/components/PillButton.tsx` |
| **Log sheet header** | The weekday, date and count sit in a fixed 150 pt zone at the top; the sheet starts below it and is capped to the remaining height, so a tall sheet (the Edit form has a Delete button; large text grows it) can never cover the date. | `app/log.tsx` |
| **Loading** | A small spinner that appears only after 250 ms, because local queries finish in a few milliseconds and an instant spinner would just flash. | `src/components/LoadingState.tsx` |
| **Error (whole app)** | Full-screen "Something went wrong" with a "Try again" pill. It says the workouts are safe and **never shows the underlying exception** (that goes to the dev console). The same screen is used if the database cannot be opened. | `src/components/ErrorFallback.tsx`, `app/_layout.tsx` |
| **Error (one screen)** | An `EmptyState` card with the message and a "Try again" button. | each screen |
| **Empty states** | `EmptyState` card: optional round icon, title, one line of guidance, and a button where an obvious next step exists (e.g. "Log an exercise"). | `src/components/EmptyState.tsx` |
| **Export (CSV)** | A 44 pt round white button with a download icon at the right of the Today header, label "Export data as CSV". Opens the iOS share sheet. With nothing logged it says "Nothing to export yet"; on failure it says the data is safe and untouched. | `src/components/ExportButton.tsx` |
| **Delete confirmation** | The native iOS alert "Delete this entry?" with Cancel and a destructive Delete. | `src/components/confirmDelete.ts` |
| **Date picker** | The native inline calendar, opened by tapping the date row and closed after a day is picked. | `src/components/DatePickerField.tsx` |
| **Larger text (Dynamic Type)** | Rows, buttons and inputs use *minimum* heights so they grow with the text. Tightly packed spots (tab labels, day cells, chart labels, totals, numeric inputs) cap scaling at 1.2 to 1.3x so columns never collide. | components |
| **Developer tools** | A hidden screen (long-press the Today greeting, dev builds only) adds or removes 5,000 clearly named fake entries to check performance on a device. Release builds redirect away from it. | `app/debug.tsx` |
