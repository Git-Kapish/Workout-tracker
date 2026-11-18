import { useRef, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import type { EntryFormState } from '@/hooks/useEntryForm';
import { MAX_REPS, MAX_SETS } from '@/lib/constants';
import type { DateString } from '@/lib/types';
import type { EntryField } from '@/lib/validation';
import { radius, size, spacing, typography, useTheme } from '@/theme';

import { confirmDelete } from './confirmDelete';
import { DatePickerField } from './DatePickerField';
import { Icon } from './Icon';
import { IconTile } from './IconTile';
import { PillButton } from './PillButton';
import { SuggestionChips } from './SuggestionChips';

interface EntryFormProps {
  form: EntryFormState;
  today: DateString;
  onClose: () => void;
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  large?: boolean;
  inputRef?: Ref<TextInputInstance>;
}

function Field({ label, error, large = false, inputRef, ...input }: FieldProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[typography.body, styles.label, { color: colors.inkMuted }]}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        selectionColor={colors.accent}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        maxFontSizeMultiplier={large ? 1.3 : undefined}
        {...input}
        style={[
          large ? styles.numeric : styles.text,
          {
            backgroundColor: colors.fieldBg,
            color: colors.ink,
            borderColor: error ? colors.trendDownFg : 'transparent',
          },
        ]}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, { color: colors.trendDownFg }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function EntryForm({ form, today, onClose }: EntryFormProps) {
  const { colors } = useTheme();
  const { fields, errors, mode } = form;
  const setsRef = useRef<TextInputInstance>(null);
  const editing = mode === 'edit';

  const onDelete = async () => {
    if (await confirmDelete(fields.exerciseName)) await form.remove();
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <IconTile icon="dumbbell" large neutral />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={8}
          style={[styles.close, { backgroundColor: colors.fieldBg }]}
        >
          <Icon name="close" color={colors.inkMuted} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Text
        accessibilityRole="header"
        style={[typography.sheetTitle, styles.title, { color: colors.ink }]}
      >
        {editing ? 'Edit exercise' : 'Log exercise'}
      </Text>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.note, { color: form.savedNote ? colors.trendUpFg : colors.inkMuted }]}
      >
        {form.note ??
          (editing ? 'Change anything, then save.' : 'Start typing, or pick a recent exercise.')}
      </Text>

      <Field
        label="Exercise"
        value={fields.exerciseName}
        onChangeText={(v) => form.setField('exerciseName', v)}
        onBlur={() => form.touch('exerciseName')}
        error={errors.exerciseName}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => setsRef.current?.focus()}
        placeholder="e.g. Bench Press"
      />
      <View style={styles.chips}>
        <SuggestionChips
          names={form.suggestions}
          current={fields.exerciseName}
          onSelect={form.selectExercise}
        />
      </View>

      <View style={styles.numbers}>
        {(
          [
            ['sets', 'Sets', 'numeric'],
            ['reps', 'Reps per set', 'numeric'],
            ['weight', 'Weight (kg)', 'decimal'],
          ] as [EntryField, string, 'numeric' | 'decimal'][]
        ).map(([field, label, keyboard]) => (
          <View key={field} style={styles.numberCol}>
            <Field
              large
              inputRef={field === 'sets' ? setsRef : undefined}
              label={label}
              value={fields[field]}
              onChangeText={(v) => form.setField(field, v)}
              onBlur={() => form.touch(field)}
              error={errors[field]}
              inputMode={keyboard}
              keyboardType={keyboard === 'decimal' ? 'decimal-pad' : 'number-pad'}
              selectTextOnFocus
              placeholder={field === 'weight' ? '—' : '0'}
            />
          </View>
        ))}
      </View>

      <View style={styles.date}>
        <DatePickerField
          value={fields.date}
          today={today}
          onChange={(d) => form.setField('date', d)}
        />
      </View>

      <PillButton
        label={form.saving ? 'Saving…' : editing ? 'Save changes' : 'Save exercise'}
        accessibilityLabel={editing ? 'Save changes' : 'Save exercise'}
        onPress={() => void form.save()}
        disabled={!form.canSave}
        style={styles.save}
      />
      {form.saveError ? (
        <Text
          accessibilityRole="alert"
          style={[typography.body, styles.centered, { color: colors.trendDownFg }]}
        >
          {form.saveError}
        </Text>
      ) : null}

      {editing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete entry"
          onPress={() => void onDelete()}
          style={styles.delete}
        >
          <Icon name="trash" color={colors.trendDownFg} size={18} />
          <Text style={[typography.rowTitle, { color: colors.trendDownFg }]}>Delete entry</Text>
        </Pressable>
      ) : null}

      <Text style={[typography.caption, styles.helper, { color: colors.inkMuted }]}>
        {`Sets 1–${MAX_SETS} · Reps 1–${MAX_REPS} · Weight accepts . or ,`}
      </Text>
    </View>
  );
}

const input = {
  borderRadius: radius.input,
  borderWidth: 1.5,
  fontWeight: '600',
} as const;

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 14 },
  note: {
    marginTop: spacing.xs,
    marginBottom: spacing.md + spacing.xs,
    fontSize: 15,
    minHeight: 20,
  },
  field: { gap: 6 },
  label: { fontSize: 13 },
  text: { ...input, minHeight: size.inputName, paddingHorizontal: spacing.lg, fontSize: 17 },
  numeric: { ...input, minHeight: size.inputNumeric, textAlign: 'center', fontSize: 24 },
  chips: { marginTop: 10 },
  numbers: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  numberCol: { flex: 1, minWidth: 0 },
  date: { marginTop: spacing.lg },
  save: { marginTop: 20 },
  centered: { textAlign: 'center', marginTop: spacing.sm },
  delete: {
    marginTop: spacing.sm,
    minHeight: size.tapMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  helper: { marginTop: spacing.md, textAlign: 'center' },
});
