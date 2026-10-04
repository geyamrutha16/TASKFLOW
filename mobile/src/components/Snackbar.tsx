import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  onHide: () => void;
  duration?: number;
}

/** Bottom toast with an optional action (used for "Task deleted · UNDO"). */
export function Snackbar({ message, actionLabel, onAction, onHide, duration = 4000 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onHide);
    }, duration);
    return () => clearTimeout(t);
  }, [message, anim, duration, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
        },
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={() => {
            onAction();
            onHide();
          }}
          hitSlop={10}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    elevation: 10,
  },
  text: { flex: 1, ...font.body, color: colors.text },
  action: { ...font.h3, color: colors.primary, letterSpacing: 0.8 },
});
