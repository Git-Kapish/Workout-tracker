import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { toPickerDate, todayLocal } from '@/lib/dates';
import { formatDateLabel } from '@/lib/format';
import type { DateString } from '@/lib/types';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { Icon } from './Icon';

interface DatePickerFieldProps {
  value: DateString;
  today: DateString;
  onChange: (date: DateString) => void;
}

// Wraps the native picker so screens only ever see 'YYYY-MM-DD' strings.
export function DatePickerField({ value, today, onChange }: DatePickerFieldProps) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const label = formatDateLabel(value, today);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date: ${label}. Change date`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={[styles.row, { backgroundColor: colors.fieldBg }]}
      >
        <Icon name="calendar" color={colors.ink} size={20} />
        <Text style={[typography.rowTitle, styles.label, { color: colors.ink, fontWeight: '500' }]}>
          {label}
        </Text>
        <Icon name="chevronRight" color={colors.inkMuted} size={18} strokeWidth={2} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={toPickerDate(value)}
          mode="date"
          display="inline"
          themeVariant={isDark ? 'dark' : 'light'}
          accentColor={colors.ink}
          onValueChange={(_event, picked) => {
            onChange(todayLocal(picked));
            setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    minHeight: size.inputRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
  },
  label: { flexGrow: 1 },
});
