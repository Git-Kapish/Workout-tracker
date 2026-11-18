import { View } from 'react-native';

import { radius, size, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

interface IconTileProps {
  icon: IconName;
  /** Large = the 56pt tile in the log sheet; default = the 44pt tile in entry rows. */
  large?: boolean;
  /** Neutral grey tile (sheet header) instead of the accent tint. */
  neutral?: boolean;
}

export function IconTile({ icon, large = false, neutral = false }: IconTileProps) {
  const { colors } = useTheme();
  const box = large ? size.tileLarge : size.tile;
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: large ? radius.historyRow : radius.tile,
        backgroundColor: neutral ? colors.bg : colors.accentTint,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon} color={neutral ? colors.ink : colors.accent} size={large ? 26 : 22} />
    </View>
  );
}
