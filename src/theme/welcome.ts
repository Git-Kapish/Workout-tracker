// Decorative colours for the one-time Welcome screen (DESIGN.md §1 "splash gradient" and
// "gradient text", plus the orb/tile accents from the design source). The Welcome screen
// is a fixed light design, so these do not vary with dark mode.
export const welcome = {
  background: ['#DCEBFA', '#FBE9EF', '#FFF6EF', '#FFFFFF'],
  backgroundStops: [0, 0.48, 0.72, 1],
  ring: 'rgba(255, 255, 255, 0.95)',
  badge: 'rgba(255, 255, 255, 0.78)',
  badgeBorder: '#FFFFFF',
  tile: 'rgba(255, 255, 255, 0.88)',
  glow: 'rgba(80, 80, 140, 0.16)',
  tallyGradient: ['#4F63F5', '#D63F95', '#E8651F'],
  tileColors: { dumbbell: '#6B4DF0', calendar: '#2F6BE0', chart: '#C93A8B', flame: '#D9581A' },
  orbs: [
    ['#8FA2FF', '#F59BC8'],
    ['#F7B38A', '#F59BC8'],
    ['#9CD0F5', '#8FA2FF'],
  ],
} as const;
