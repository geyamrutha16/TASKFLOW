import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  /** Renders an eye button that toggles password visibility. */
  password?: boolean;
}

/** Labelled input with icon, focus glow, inline error and optional password toggle. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, icon, error, password, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { borderColor }, multiline && styles.multiline]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textFaint}
            style={multiline ? styles.iconTop : undefined}
          />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.primary}
          secureTextEntry={password && hidden}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
        {password && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel="Toggle password visibility">
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { ...font.tiny, color: colors.textMuted, textTransform: 'uppercase' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
  },
  multiline: { alignItems: 'flex-start', paddingTop: spacing.sm },
  iconTop: { marginTop: 6 },
  input: { flex: 1, ...font.body, color: colors.text, paddingVertical: 14 },
  inputMultiline: { minHeight: 90, paddingTop: 4, textAlignVertical: 'top' },
  error: { ...font.small, color: colors.danger },
});
