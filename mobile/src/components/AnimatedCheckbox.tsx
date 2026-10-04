import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  /** Ring colour while unchecked - we pass the task's priority colour. */
  color?: string;
  size?: number;
}

/** Round checkbox that "pops" with a spring when ticked. */
export function AnimatedCheckbox({ checked, onToggle, color = colors.primary, size = 28 }: Props) {
  const scale = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: checked ? 1 : 0,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [checked, scale]);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: checked ? 'transparent' : color }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }], opacity: scale }]}>
        <LinearGradient colors={gradients.success} style={[styles.fill, { borderRadius: size / 2 }]}>
          <Ionicons name="checkmark" size={size * 0.62} color={colors.bg} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
