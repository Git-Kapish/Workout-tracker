import {
  APP_ICON_OPTIONS,
  appIconFromNativeName,
  nativeNameForIcon,
  parseAppIconId,
} from '@/lib/appIcons';
import fs from 'fs';
import path from 'path';

describe('app icon options', () => {
  it('offers the dark default first, then the two alternates from the logo pack', () => {
    expect(APP_ICON_OPTIONS.map((o) => o.id)).toEqual(['default', 'light', 'brand']);
    expect(APP_ICON_OPTIONS.map((o) => o.label)).toEqual(['Dark', 'Light', 'Brand']);
    expect(APP_ICON_OPTIONS[0]?.nativeName).toBeNull(); // the default is the app.json icon
  });

  it('has unique ids and native names', () => {
    const ids = APP_ICON_OPTIONS.map((o) => o.id);
    const names = APP_ICON_OPTIONS.map((o) => o.nativeName).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('matches the icons registered in app.json (names and image files)', () => {
    const root = path.resolve(__dirname, '..', '..');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')) as {
      expo: { plugins: unknown[] };
    };
    const plugin = config.expo.plugins.find(
      (p): p is [string, { name: string; ios: string }[]] =>
        Array.isArray(p) && p[0] === 'expo-alternate-app-icons',
    );
    expect(plugin).toBeDefined();
    const registered = plugin?.[1] ?? [];
    const wanted = APP_ICON_OPTIONS.flatMap((o) => (o.nativeName ? [o.nativeName] : []));
    expect(registered.map((r) => r.name).sort()).toEqual([...wanted].sort());
    for (const icon of registered) {
      expect(fs.existsSync(path.join(root, icon.ios))).toBe(true); // the PNG is really there
    }
  });
});

describe('appIconFromNativeName', () => {
  it('maps the active icon name back to an id; null and unknown mean the default', () => {
    expect(appIconFromNativeName('IconLight')).toBe('light');
    expect(appIconFromNativeName('IconBrand')).toBe('brand');
    expect(appIconFromNativeName(null)).toBe('default');
    expect(appIconFromNativeName(undefined)).toBe('default');
    expect(appIconFromNativeName('SomethingElse')).toBe('default');
  });
});

describe('parseAppIconId', () => {
  it('accepts known ids and falls back to the default for anything else', () => {
    expect(parseAppIconId('light')).toBe('light');
    expect(parseAppIconId('brand')).toBe('brand');
    expect(parseAppIconId('default')).toBe('default');
    expect(parseAppIconId(null)).toBe('default');
    expect(parseAppIconId('')).toBe('default');
    expect(parseAppIconId('IconLight')).toBe('default'); // a native name is not an id
  });
});

describe('nativeNameForIcon', () => {
  it('round-trips with appIconFromNativeName', () => {
    for (const option of APP_ICON_OPTIONS) {
      expect(appIconFromNativeName(nativeNameForIcon(option.id))).toBe(option.id);
    }
  });
});
