import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { APP_ICON_OPTIONS, type AppIconId } from '@/lib/appIcons';
import { radius, spacing, typography, useTheme } from '@/theme';

import { Icon } from './Icon';

// The same PNGs the app icons are built from (assets/images/icon.png is the default).
const PREVIEWS: Record<AppIconId, ImageSourcePropType> = {
  default: require('../../assets/images/icon.png'),
  light: require('../../assets/icons/icon-light.png'),
  brand: require('../../assets/icons/icon-brand.png'),
};

const TILE = 76;

interface AppIconPickerProps {
  selected: AppIconId;
  onSelect: (id: AppIconId) => void;
  disabled?: boolean;
}

export function AppIconPicker({ selected, onSelect, disabled = false }: AppIconPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="App icon">
      {APP_ICON_OPTIONS.map((option) => {
        const isSelected = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={`${option.label} app icon, ${option.description}`}
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <View style={[styles.ring, { borderColor: isSelected ? colors.ink : 'transparent' }]}>
              <Image
                source={PREVIEWS[option.id]}
                style={styles.image}
                accessibilityIgnoresInvertColors
              />
              {isSelected ? (
                <View style={[styles.badge, { backgroundColor: colors.ink }]}>
                  <Icon name="check" color={colors.surface} size={12} strokeWidth={3} />
                </View>
              ) : null}
            </View>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                typography.body,
                { color: colors.ink, fontWeight: isSelected ? '600' : '500' },
              ]}
            >
              {option.label}
            </Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[typography.caption, { color: colors.inkMuted }]}
              numberOfLines={1}
            >
              {option.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  option: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44 },
  pressed: { transform: [{ scale: 0.97 }] },
  ring: {
    width: TILE + 10,
    height: TILE + 10,
    borderRadius: radius.card,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  // iOS app icons use a continuous ("squircle") corner of about 22% of the width.
  image: { width: TILE, height: TILE, borderRadius: TILE * 0.2237, borderCurve: 'continuous' },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
