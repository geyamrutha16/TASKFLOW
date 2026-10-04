import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, gradients, spacing } from '../theme';

/** Logo + headline shared by the login and register screens. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.primary} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name="checkmark-done" size={36} color={colors.text} />
      </LinearGradient>
      <Text style={styles.brand}>
        Task<Text style={{ color: colors.primary }}>Flow</Text>
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'flex-start', marginBottom: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  brand: { ...font.h3, color: colors.text, marginTop: spacing.lg, letterSpacing: 1 },
  title: { ...font.h1, color: colors.text, marginTop: spacing.xl },
  subtitle: { ...font.body, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
});
