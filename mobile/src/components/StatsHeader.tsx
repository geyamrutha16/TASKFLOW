import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, gradients, radius, spacing } from '../theme';

interface Props {
  progress: number; // 0..1
  completed: number;
  total: number;
  dueToday: number;
  overdue: number;
}

/** Gradient "hero" card on the home screen with an animated progress bar. */
export function StatsHeader({ progress, completed, total, dueToday, overdue }: Props) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: progress, duration: 700, useNativeDriver: false }).start();
  }, [progress, width]);

  const pct = Math.round(progress * 100);
  const mood =
    total === 0 ? 'A clean slate ✨'
    : pct === 100 ? 'Everything done. Legend! 🏆'
    : pct >= 60 ? 'Crushing it 🔥'
    : pct >= 30 ? 'Nice momentum ⚡'
    : "Let's get rolling 🚀";

  return (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>TODAY'S PROGRESS</Text>
          <Text style={styles.mood}>{mood}</Text>
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>

      <View style={styles.statsRow}>
        <Stat value={`${completed}/${total}`} label="Done" />
        <View style={styles.divider} />
        <Stat value={dueToday} label="Due today" />
        <View style={styles.divider} />
        <Stat value={overdue} label="Overdue" highlight={overdue > 0} />
      </View>
    </LinearGradient>
  );
}

function Stat({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statAlert]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  kicker: { ...font.tiny, color: 'rgba(255,255,255,0.75)' },
  mood: { ...font.h3, color: colors.text, marginTop: 4 },
  pct: { fontSize: 38, fontWeight: '900', color: colors.text },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.text },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...font.h2, color: colors.text },
  statAlert: { color: '#FFE3EA' },
  statLabel: { ...font.small, color: 'rgba(255,255,255,0.8)' },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
});
