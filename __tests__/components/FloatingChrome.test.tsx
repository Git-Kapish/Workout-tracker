import { render, screen } from '@testing-library/react-native';

import { TallyLogo } from '@/components/TallyLogo';
import { tabBarBottomOffset } from '@/hooks/useTabBarClearance';
import { floatingBar } from '@/theme';

describe('tabBarBottomOffset (the floating bar sits just above the home indicator)', () => {
  it('tucks the bar into the bottom safe area on phones with a home indicator', () => {
    expect(tabBarBottomOffset(34)).toBe(28);
  });

  it('never goes below the minimum gap, even for a tiny inset', () => {
    expect(tabBarBottomOffset(10)).toBe(floatingBar.minBottom);
  });

  it('uses the minimum gap on devices without a bottom inset', () => {
    expect(tabBarBottomOffset(0)).toBe(floatingBar.minBottom);
  });
});

describe('TallyLogo', () => {
  it('is announced as an image named Tally logo', async () => {
    await render(<TallyLogo size={64} />);
    expect(screen.getByLabelText('Tally logo')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'Tally logo' })).toBeOnTheScreen();
  });

  it('keeps the logo proportions at any size', async () => {
    await render(<TallyLogo size={100} />);
    const { width, height } = screen.getByLabelText('Tally logo').props;
    // the viewBox is 59 x 53 in the logo pack
    expect(width).toBe(100);
    expect(width / height).toBeCloseTo(59 / 53, 3);
  });
});
