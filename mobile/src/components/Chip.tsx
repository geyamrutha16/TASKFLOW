import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Accent colour used when selected (defaults to the brand violet). */
  color?: string;
  size?: 'sm' | 'md';
}

/** Selectable pill - used for filters, sort modes, priority and category pickers. */
export function Chip({ label, selected, onPress, icon, color = colors.primary, size = 'md' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.sm,
        selected
          ? { backgroundColor: `${color}26`, borderColor: color }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon && <Ionicons name={icon} size={size === 'sm' ? 12 : 14} color={selected ? color : colors.textMuted} />}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: selected ? color : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sm: { paddingHorizontal: 10, paddingVertical: 4 },
  label: { ...font.small },
  labelSm: { fontSize: 11 },
});
