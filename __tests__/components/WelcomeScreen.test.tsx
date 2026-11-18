import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WelcomeScreen from '../../app/welcome';
import { runMigrations } from '@/db/migrations';
import { createSettingsRepository } from '@/db/settings';
import { WelcomeProvider } from '@/hooks/useWelcome';
import { lightPalette } from '@/theme/colors';
import { contrast } from '../helpers/contrast';
import { createTestExecutor } from '../helpers/sqliteExecutor';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'dark'), // the phone is in dark mode
}));

describe('Welcome screen in dark mode', () => {
  it('stays a light scene: black button, dark text, all readable on the pastel background', async () => {
    const db = createTestExecutor();
    await runMigrations(db);
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <WelcomeProvider settings={createSettingsRepository(db)} initialSeen={false}>
          <WelcomeScreen />
        </WelcomeProvider>
      </SafeAreaProvider>,
    );

    const button = StyleSheet.flatten(
      screen.getByRole('button', { name: 'Get started' }).props.style,
    );
    const label = StyleSheet.flatten(screen.getByText('Get started').props.style);
    expect(button.backgroundColor).toBe(lightPalette.ink); // black, not the near-white of dark mode
    expect(contrast(String(label.color), String(button.backgroundColor))).toBeGreaterThanOrEqual(
      4.5,
    );

    const headline = StyleSheet.flatten(screen.getByText('Every rep,').props.style);
    expect(headline.color).toBe(lightPalette.ink);
    // the white end of the splash gradient: the dark text must be readable on it
    expect(contrast(String(headline.color), '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
