import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../components/ScreenBackground';
import { StatsHeader } from '../components/StatsHeader';
import { TaskCard } from '../components/TaskCard';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { Snackbar } from '../components/Snackbar';
import { useAppDispatch, useAppSelector } from '../store';
import {
  clearTasksError,
  deleteTask,
  fetchTasks,
  restoreTask,
  selectStats,
  selectVisibleTasks,
  setCategoryFilter,
  setSearch,
  setSortMode,
  setStatusFilter,
  toggleTask,
} from '../store/tasksSlice';
import { categoryMeta, colors, font, gradients, radius, spacing } from '../theme';
import type { Category, SortMode, StatusFilter, Task } from '../types';
import { greeting } from '../utils/dates';

const SORT_OPTIONS: { mode: SortMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'smart', label: 'Smart', icon: 'sparkles' },
  { mode: 'deadline', label: 'Deadline', icon: 'flag' },
  { mode: 'priority', label: 'Priority', icon: 'flame' },
  { mode: 'dateTime', label: 'Schedule', icon: 'time' },
  { mode: 'newest', label: 'Newest', icon: 'add-circle' },
];

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
];

/** Home: dashboard header, search, filters, sort modes and the task list. */
export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  // Re-rank every minute so "due in 5m" and the smart order stay accurate.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const user = useAppSelector((s) => s.auth.user);
  const { status, error, sortMode, statusFilter, categoryFilter, search } = useAppSelector((s) => s.tasks);
  const tasks = useAppSelector((s) => selectVisibleTasks(s, now));
  const stats = useAppSelector(selectStats);

  // Snackbar state: last deleted task (for undo) or an error message.
  const [snack, setSnack] = useState<{ message: string; undo?: Task } | null>(null);

  const load = useCallback(() => dispatch(fetchTasks()), [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  // Surface API errors (e.g. a rolled-back optimistic update) as a toast.
  // A failed initial load keeps its error so the empty state can show it too.
  useEffect(() => {
    if (!error) return;
    setSnack({ message: error });
    if (status !== 'failed') dispatch(clearTasksError());
  }, [error, status, dispatch]);

  // Stable callbacks so memoised TaskCards don't re-render needlessly.
  const onToggle = useCallback(
    (task: Task) => {
      Haptics.impactAsync(task.completed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
      dispatch(toggleTask(task.id));
    },
    [dispatch],
  );

  const onDelete = useCallback(
    (task: Task) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      dispatch(deleteTask(task));
      setSnack({ message: `"${task.title}" deleted`, undo: task });
    },
    [dispatch],
  );

  const onOpen = useCallback((task: Task) => router.push(`/task/${task.id}`), []);

  const hideSnack = useCallback(() => setSnack(null), []);

  const listHeader = (
    <View style={styles.headerBlock}>
      <StatsHeader
        progress={stats.progress}
        completed={stats.completed}
        total={stats.total}
        dueToday={stats.dueToday}
        overdue={stats.overdue}
      />

      {/* Search */}
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          value={search}
          onChangeText={(t) => dispatch(setSearch(t))}
          placeholder="Search tasks…"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.primary}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => dispatch(setSearch(''))} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Status segmented control */}
      <View style={styles.segment}>
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count = tab.value === 'all' ? stats.total : tab.value === 'active' ? stats.active : stats.completed;
          return (
            <Pressable key={tab.value} style={styles.segmentItem} onPress={() => dispatch(setStatusFilter(tab.value))}>
              {active && (
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              )}
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {tab.label} · {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sort modes */}
      <Text style={styles.sectionLabel}>SORT BY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SORT_OPTIONS.map((o) => (
          <Chip
            key={o.mode}
            label={o.label}
            icon={o.icon}
            selected={sortMode === o.mode}
            onPress={() => {
              Haptics.selectionAsync();
              dispatch(setSortMode(o.mode));
            }}
          />
        ))}
      </ScrollView>
      {sortMode === 'smart' && (
        <Text style={styles.hint}>
          <Ionicons name="sparkles" size={11} color={colors.primary} /> Blends deadline proximity, priority and schedule to
          surface what matters most right now.
        </Text>
      )}

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" size="sm" selected={categoryFilter === 'all'} onPress={() => dispatch(setCategoryFilter('all'))} />
        {(Object.keys(categoryMeta) as Category[]).map((c) => (
          <Chip
            key={c}
            size="sm"
            label={categoryMeta[c].label}
            icon={categoryMeta[c].icon}
            color={categoryMeta[c].color}
            selected={categoryFilter === c}
            onPress={() => dispatch(setCategoryFilter(c))}
          />
        ))}
      </ScrollView>
    </View>
  );

  const emptyState =
    status === 'loading' ? null
    : status === 'failed' ? <EmptyState icon="cloud-offline" title="Couldn't load tasks" subtitle={`${error}\nPull down to retry.`} />
    : stats.total === 0 ? <EmptyState icon="rocket" title="No tasks yet" subtitle="Tap the + button to add your first task." />
    : <EmptyState icon="search" title="Nothing matches" subtitle="Try a different search or filter." />;

  return (
    <ScreenBackground>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name?.split(' ')[0] ?? 'there'} 👋
          </Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Open profile">
          <LinearGradient colors={gradients.primary} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TaskCard task={item} onToggle={onToggle} onDelete={onDelete} onPress={onOpen} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={load}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      />

      {/* Floating "add task" button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/task-form');
        }}
        accessibilityLabel="Add task"
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 24, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
      >
        <LinearGradient colors={gradients.primary} style={styles.fabFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={32} color={colors.text} />
        </LinearGradient>
      </Pressable>

      <Snackbar
        message={snack?.message ?? null}
        actionLabel={snack?.undo ? 'UNDO' : undefined}
        onAction={snack?.undo ? () => dispatch(restoreTask(snack.undo!)) : undefined}
        onHide={hideSnack}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  greeting: { ...font.body, color: colors.textMuted },
  name: { ...font.h1, color: colors.text },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.h2, color: colors.text },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerBlock: { gap: spacing.lg, marginBottom: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, ...font.body, color: colors.text, paddingVertical: 12 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm, overflow: 'hidden' },
  segmentText: { ...font.small, color: colors.textMuted },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  sectionLabel: { ...font.tiny, color: colors.textFaint, marginBottom: -spacing.sm },
  chipRow: { gap: spacing.sm, paddingRight: spacing.xl },
  hint: { ...font.small, color: colors.textMuted, marginTop: -spacing.sm, lineHeight: 18 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    borderRadius: 32,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  fabFill: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
