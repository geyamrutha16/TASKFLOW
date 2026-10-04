import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../components/ScreenBackground';
import { GradientButton } from '../components/GradientButton';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import { selectStats } from '../store/tasksSlice';
import { colors, font, gradients, priorityMeta, radius, spacing } from '../theme';
import type { Priority } from '../types';

/** Account info, productivity stats and logout. */
export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const stats = useAppSelector(selectStats);

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const openTotal = stats.byPriority.high + stats.byPriority.medium + stats.byPriority.low;

  const onLogout = () => {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      // The auth guard in _layout redirects to /login once state is cleared.
      { text: 'Log out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Identity */}
        <View style={styles.identity}>
          <LinearGradient colors={gradients.primary} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {!!memberSince && <Text style={styles.since}>Member since {memberSince}</Text>}
        </View>

        {/* Stat tiles */}
        <View style={styles.grid}>
          <Tile icon="list" label="Total tasks" value={stats.total} color={colors.primary} />
          <Tile icon="checkmark-done" label="Completed" value={stats.completed} color={colors.success} />
          <Tile icon="today" label="Done today" value={stats.completedToday} color={colors.info} />
          <Tile icon="alert-circle" label="Overdue" value={stats.overdue} color={colors.danger} />
        </View>

        {/* Open tasks by priority */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Open tasks by priority</Text>
          {(['high', 'medium', 'low'] as Priority[]).map((p) => {
            const count = stats.byPriority[p];
            const meta = priorityMeta[p];
            return (
              <View key={p} style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.barLabel}>
                    <Ionicons name={meta.icon} size={12} color={meta.color} /> {meta.label}
                  </Text>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${openTotal ? (count / openTotal) * 100 : 0}%`, backgroundColor: meta.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Completion rate</Text>
            <Text style={[styles.cardTitle, { color: colors.success }]}>{Math.round(stats.progress * 100)}%</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${stats.progress * 100}%` }]} />
          </View>
        </View>

        <GradientButton title="Log out" icon="log-out" variant="danger" onPress={onLogout} />
      </ScrollView>
    </ScreenBackground>
  );
}

function Tile(props: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: number; color: string }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${props.color}22` }]}>
        <Ionicons name={props.icon} size={18} color={props.color} />
      </View>
      <Text style={styles.tileValue}>{props.value}</Text>
      <Text style={styles.tileLabel}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { ...font.h2, color: colors.text },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  identity: { alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 36, fontWeight: '800', color: colors.text },
  name: { ...font.h2, color: colors.text },
  email: { ...font.body, color: colors.textMuted },
  since: { ...font.small, color: colors.textFaint, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
  },
  tileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  tileValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  tileLabel: { ...font.small, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  cardTitle: { ...font.h3, color: colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { ...font.small, color: colors.textMuted },
  barValue: { ...font.small, color: colors.text, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
