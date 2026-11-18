import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconPicker } from '@/components/AppIconPicker';
import { useExportAction } from '@/components/ExportButton';
import { confirmErase } from '@/components/confirmErase';
import { Icon } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { RoundButton } from '@/components/RoundButton';
import { TallyLogo } from '@/components/TallyLogo';
import { useAppIcon } from '@/hooks/useAppIcon';
import { useEraseData } from '@/hooks/useEraseData';
import { haptics } from '@/platform/haptics';
import { radius, spacing, typography, useTheme } from '@/theme';

/** Settings (a modal opened from the Today header): app icon, data export, about. */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const icon = useAppIcon();
  const exportAction = useExportAction();
  const eraseData = useEraseData();

  const deleteEverything = async () => {
    const entryCount = await eraseData.count();
    if (entryCount === 0) {
      Alert.alert('Nothing to delete', 'You have not logged anything yet.');
      return;
    }
    const choice = await confirmErase(entryCount);
    if (choice === 'export') {
      await exportAction.run();
      return;
    }
    if (choice !== 'erase') return;
    const outcome = await eraseData.erase();
    if (outcome === 'done') {
      haptics.warning();
      Alert.alert('All data deleted', 'Your log is empty. You can start fresh.');
    } else if (outcome === 'failed') {
      Alert.alert("Couldn't delete", 'Nothing was changed. Please try again.');
    }
  };
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.top}>
        <Text accessibilityRole="header" style={[typography.sheetTitle, { color: colors.ink }]}>
          settings.
        </Text>
        <RoundButton icon="close" label="Close settings" onPress={() => router.back()} />
      </View>

      <View style={styles.brand}>
        <TallyLogo size={64} />
        <Text style={[typography.body, { color: colors.inkMuted }]}>Tally {version}</Text>
      </View>

      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>APP ICON</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <AppIconPicker
          selected={icon.selected}
          onSelect={(id) => void icon.choose(id)}
          disabled={!icon.ready || icon.busy}
        />
        {icon.error ? (
          <Text
            accessibilityRole="alert"
            style={[typography.caption, { color: colors.trendDownFg }]}
          >
            {icon.error}
          </Text>
        ) : null}
        <Text style={[typography.caption, styles.note, { color: colors.inkMuted }]}>
          {icon.canChange
            ? 'Changes the icon on your Home Screen. iOS shows a short notice when it changes.'
            : 'Switching the Home Screen icon only works in the installed app (a TestFlight build). Here your choice is saved, but the icon stays as it is.'}
        </Text>
      </View>

      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>DATA</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export all data as CSV"
        accessibilityState={{ disabled: exportAction.exporting, busy: exportAction.exporting }}
        disabled={exportAction.exporting}
        onPress={() => void exportAction.run()}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, opacity: exportAction.exporting ? 0.5 : 1 },
          pressed && styles.pressed,
        ]}
      >
        <IconTile icon="download" />
        <View style={styles.rowText}>
          <Text style={[typography.rowTitle, { color: colors.ink }]}>Export all data</Text>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>
            A CSV backup: Save to Files, AirDrop or Mail
          </Text>
        </View>
        <Icon name="chevronRight" color={colors.inkMuted} size={16} strokeWidth={2} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete all data"
        accessibilityState={{ disabled: eraseData.erasing, busy: eraseData.erasing }}
        disabled={eraseData.erasing}
        onPress={() => void deleteEverything()}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, opacity: eraseData.erasing ? 0.5 : 1 },
          pressed && styles.pressed,
        ]}
      >
        <IconTile icon="trash" />
        <View style={styles.rowText}>
          <Text style={[typography.rowTitle, { color: colors.trendDownFg }]}>Delete all data</Text>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>
            Removes every logged exercise from this phone
          </Text>
        </View>
        <Icon name="chevronRight" color={colors.inkMuted} size={16} strokeWidth={2} />
      </Pressable>

      <Text style={[typography.eyebrow, styles.eyebrow, { color: colors.inkMuted }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[typography.body, { color: colors.ink, fontWeight: '400', lineHeight: 20 }]}>
          Everything you log stays on this phone. There is no account and the app never uses the
          network. Export a backup now and then.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenX, gap: spacing.sm },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  brand: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  eyebrow: { marginTop: spacing.md, marginLeft: spacing.xs + 2 },
  card: { padding: spacing.lg, borderRadius: radius.card, gap: spacing.md },
  note: { fontSize: 12, lineHeight: 17 },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { transform: [{ scale: 0.98 }] },
});
