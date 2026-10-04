import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, gradients, spacing } from '../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

/** Friendly placeholder shown when a list has nothing to display. */
export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.primary} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={34} color={colors.text} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl, gap: spacing.sm },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  title: { ...font.h2, color: colors.text, textAlign: 'center' },
  subtitle: { ...font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
