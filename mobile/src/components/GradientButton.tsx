import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, gradients, radius } from '../theme';

type Variant = 'primary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

/** The app's main call-to-action button: gradient fill, press feedback, spinner. */
export function GradientButton({ title, onPress, icon, loading, disabled, variant = 'primary', style }: Props) {
  const inactive = disabled || loading;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={colors.text} />}
          <Text style={styles.label}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { opacity: inactive ? 0.6 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      {variant === 'ghost' ? (
        <View style={[styles.fill, styles.ghost]}>{content}</View>
      ) : (
        <LinearGradient
          colors={variant === 'danger' ? gradients.danger : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fill: { borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 20 },
  ghost: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 22 },
  label: { ...font.h3, color: colors.text },
});
