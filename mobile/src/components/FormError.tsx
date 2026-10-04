import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';

/** Inline banner for server-side form errors (e.g. "Invalid email or password"). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.danger}1A`,
    borderColor: `${colors.danger}55`,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: { flex: 1, ...font.small, color: colors.danger },
});
