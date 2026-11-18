// The Home Screen icons the user can choose between (Settings > App icon). The first is the
// default icon from app.json; the others are the alternates registered with the
// expo-alternate-app-icons plugin in app.json, whose `name` must match `nativeName` here.

export type AppIconId = 'default' | 'light' | 'brand';

export interface AppIconOption {
  id: AppIconId;
  label: string;
  description: string;
  /** The name registered in app.json, or null for the default icon. */
  nativeName: string | null;
}

export const APP_ICON_OPTIONS: readonly AppIconOption[] = [
  { id: 'default', label: 'Dark', description: 'The default', nativeName: null },
  { id: 'light', label: 'Light', description: 'Soft and bright', nativeName: 'IconLight' },
  { id: 'brand', label: 'Brand', description: 'Full gradient', nativeName: 'IconBrand' },
];

/** Where the chosen icon is remembered (so it also shows as selected where it cannot be applied). */
export const APP_ICON_SETTING_KEY = 'app_icon';

/** The icon id for the name iOS reports as active; null or an unknown name means the default. */
export function appIconFromNativeName(name: string | null | undefined): AppIconId {
  return (
    APP_ICON_OPTIONS.find((o) => o.nativeName !== null && o.nativeName === name)?.id ?? 'default'
  );
}

/** A saved setting back to an icon id, ignoring anything that is not a known icon. */
export function parseAppIconId(value: string | null | undefined): AppIconId {
  return APP_ICON_OPTIONS.find((o) => o.id === value)?.id ?? 'default';
}

export function nativeNameForIcon(id: AppIconId): string | null {
  return APP_ICON_OPTIONS.find((o) => o.id === id)?.nativeName ?? null;
}
