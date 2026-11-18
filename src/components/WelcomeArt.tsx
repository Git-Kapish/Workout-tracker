import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { radius } from '@/theme';
import { welcome } from '@/theme/welcome';

import { Icon, type IconName } from './Icon';
import { TallyLogo } from './TallyLogo';

// Positions are from the design source, laid out in a 390pt-wide frame centred on screen.
const FRAME_WIDTH = 390;

const TILES: { name: IconName | 'flame'; color: string; left: number; top: number }[] = [
  { name: 'dumbbell', color: welcome.tileColors.dumbbell, left: 263, top: 115 },
  { name: 'calendar', color: welcome.tileColors.calendar, left: 57, top: 230 },
  { name: 'chart', color: welcome.tileColors.chart, left: 306, top: 358 },
  { name: 'flame', color: welcome.tileColors.flame, left: 125, top: 361 },
];

const ORBS = [
  { left: 38, top: 176, size: 28, colors: welcome.orbs[0] },
  { left: 278, top: 223, size: 22, colors: welcome.orbs[1] },
  { left: 73, top: 414, size: 20, colors: welcome.orbs[2] },
];

function Flame({ color }: { color: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.2.9 2 1.7 2.4C10.3 8.6 10.8 5.5 12 3z"
      />
    </Svg>
  );
}

/** Decorative orbit illustration. Hidden from screen readers. */
export function WelcomeArt() {
  return (
    <View
      style={styles.frame}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.ring, { left: 20, top: 115, width: 350, height: 350 }]} />
      <View style={[styles.ring, { left: 85, top: 180, width: 220, height: 220 }]} />
      <View style={styles.badge}>
        <TallyLogo size={56} variant="color" />
      </View>
      {TILES.map((tile) => (
        <View key={tile.name} style={[styles.tile, { left: tile.left, top: tile.top }]}>
          {tile.name === 'flame' ? (
            <Flame color={tile.color} />
          ) : (
            <Icon name={tile.name} color={tile.color} size={30} />
          )}
        </View>
      ))}
      {ORBS.map((orb) => (
        <LinearGradient
          key={orb.left}
          colors={[...orb.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            borderRadius: radius.full,
          }}
        />
      ))}
    </View>
  );
}

/** "counted." in the brand gradient, drawn as SVG text so no masking library is needed. */
export function GradientWord({ text, fontSize }: { text: string; fontSize: number }) {
  const width = text.length * fontSize * 0.56;
  const height = fontSize * 1.25;
  return (
    <Svg width={width} height={height} accessibilityLabel={text} accessible>
      <Defs>
        <SvgGradient id="wordGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={welcome.tallyGradient[0]} />
          <Stop offset="0.5" stopColor={welcome.tallyGradient[1]} />
          <Stop offset="1" stopColor={welcome.tallyGradient[2]} />
        </SvgGradient>
      </Defs>
      <SvgText
        x={width / 2}
        y={fontSize}
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing={-fontSize * 0.03}
        textAnchor="middle"
        fill="url(#wordGradient)"
      >
        {text}
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: { width: FRAME_WIDTH, alignSelf: 'center', flex: 1 },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: welcome.ring,
    borderRadius: radius.full,
  },
  badge: {
    position: 'absolute',
    left: 139,
    top: 234,
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: welcome.badge,
    borderWidth: 1,
    borderColor: welcome.badgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: welcome.glow,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    shadowOpacity: 1,
  },
  tile: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: welcome.tile,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: welcome.glow,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    shadowOpacity: 1,
  },
});
