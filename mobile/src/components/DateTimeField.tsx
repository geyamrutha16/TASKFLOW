import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { formatDate, formatTime, relativeToNow } from '../utils/dates';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  minimumDate?: Date;
  error?: string | null;
}

/**
 * Pick a full date + time.
 * Android has no combined picker, so we chain the native date dialog
 * into the native time dialog. iOS gets the inline compact picker.
 */
export function DateTimeField({ label, value, onChange, icon = 'calendar', minimumDate, error }: Props) {
  const [iosOpen, setIosOpen] = useState(false);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      minimumDate,
      design: 'material',
      onValueChange: (_e, pickedDate) => {
        // Step 2: once a day is chosen, ask for the time on that day.
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          design: 'material',
          onValueChange: (_e2, pickedTime) => {
            const merged = new Date(pickedDate);
            merged.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            onChange(merged);
          },
        });
      },
    });
  };

  const iso = value.toISOString();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => (Platform.OS === 'android' ? openAndroid() : setIosOpen((o) => !o))}
        style={({ pressed }) => [styles.field, error && { borderColor: colors.danger }, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(iso)} ${formatTime(iso)}`}
      >
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.value}>
            {formatDate(iso)} · {formatTime(iso)}
          </Text>
          <Text style={styles.hint}>{relativeToNow(iso)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
      {Platform.OS === 'ios' && iosOpen && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="inline"
          themeVariant="dark"
          minimumDate={minimumDate}
          onValueChange={(_e, d) => onChange(d)}
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, flex: 1 },
  label: { ...font.tiny, color: colors.textMuted, textTransform: 'uppercase' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { ...font.body, color: colors.text, fontWeight: '600' },
  hint: { ...font.small, color: colors.textFaint, marginTop: 2 },
  error: { ...font.small, color: colors.danger },
});
