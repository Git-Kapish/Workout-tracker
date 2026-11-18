# Tally logo

**Idea:** four bars and a slash, the tally mark for five. The slash carries the brand gradient (indigo > pink > orange).

## Files
- `assets/icon.png`: 1024x1024, opaque, square corners. iOS applies the rounded mask itself, so do not round or add transparency.
- `assets/favicon.png`: 48x48 (web only; not needed for the iPhone app).
- `assets/lockup-light.png`, `lockup-dark.png`: mark + "tally" wordmark, transparent background.
- `svg/`: icon sources (dark primary, light, brand gradient) and the mark alone in colour, reversed, black and white.
- `alternate/`: light and brand-gradient icon PNGs, if you prefer one.

## Use in the Expo project (app.json)
```json
{ "expo": { "icon": "./assets/icon.png", "ios": { "icon": "./assets/icon.png" } } }
```
Copy `assets/icon.png` to the project's `assets/` folder. The icon is only visible in a real build (EAS/TestFlight); Expo Go shows its own icon, so you will not see it on the phone during Phases 0-6.

## Rules
- Clear space: one bar width on every side. Minimum size for the mark alone: 16 pt.
- Wordmark: Inter Bold, lower-case, tracking -4%. Do not add the tagline to the lockup.
- On dark backgrounds use the reversed mark (white bars, pastel gradient slash). On one-colour print use the black or white mark.
