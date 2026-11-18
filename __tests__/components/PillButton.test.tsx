import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { PillButton } from '@/components/PillButton';
import { ForceLightTheme } from '@/theme';
import { contrast } from '../helpers/contrast';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useColorScheme: jest.Mock = jest.requireMock(
  'react-native/Libraries/Utilities/useColorScheme',
).default;

type Variant = 'primary' | 'inverse' | 'secondary';
type Scheme = 'light' | 'dark';

/** The pill's real background and label colour, as rendered. */
async function renderPill(variant: Variant, scheme: Scheme, forceLight = false) {
  useColorScheme.mockReturnValue(scheme);
  const button = <PillButton label="Go" variant={variant} onPress={() => undefined} />;
  await render(forceLight ? <ForceLightTheme>{button}</ForceLightTheme> : button);
  const pill = StyleSheet.flatten(screen.getByRole('button', { name: 'Go' }).props.style);
  const label = StyleSheet.flatten(screen.getByText('Go').props.style);
  return { background: String(pill.backgroundColor), label: String(label.color) };
}

describe('PillButton is readable in every variant and both appearances', () => {
  it.each([
    ['primary', 'light'],
    ['primary', 'dark'],
    ['inverse', 'light'],
    ['inverse', 'dark'], // regression: the label used to turn white on the white pill
    ['secondary', 'light'],
    ['secondary', 'dark'],
  ] as [Variant, Scheme][])('%s button in %s mode', async (variant, scheme) => {
    const { background, label } = await renderPill(variant, scheme);
    expect(label).not.toBe(background);
    expect(contrast(label, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('the inverse pill is white with a dark label in dark mode (as on the hero card)', async () => {
    const { background, label } = await renderPill('inverse', 'dark');
    expect(background.toLowerCase()).toBe('#ffffff');
    expect(label.toLowerCase()).not.toBe('#f4f4f6'); // the dark-mode ink colour
  });

  it('forcing the light theme keeps the primary button black even in dark mode (Welcome screen)', async () => {
    const dark = await renderPill('primary', 'dark');
    const forced = await renderPill('primary', 'dark', true);
    expect(forced.background.toLowerCase()).toBe('#141414');
    expect(forced.background).not.toBe(dark.background);
    expect(contrast(forced.label, forced.background)).toBeGreaterThanOrEqual(4.5);
  });
});
