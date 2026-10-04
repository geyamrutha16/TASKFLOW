import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../../components/ScreenBackground';
import { GradientButton } from '../../components/GradientButton';
import { EmptyState } from '../../components/EmptyState';
import { useAppDispatch, useAppSelector } from '../../store';
import { deleteTask, selectTaskById, toggleTask } from '../../store/tasksSlice';
import { categoryMeta, colors, font, priorityMeta, radius, spacing } from '../../theme';
import { formatDateTime, isOverdue, relativeToNow } from '../../utils/dates';
import { PRIORITY_WEIGHT, deadlinePressure, schedulePressure, urgencyLevel, urgencyScore } from '../../utils/smartSort';

/** Full view of a single task, including a breakdown of its smart-sort score. */
export default function TaskDetailScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useAppSelector((s) => selectTaskById(s, id));

  if (!task) {
    return (
      <ScreenBackground>
        <View style={{ paddingTop: insets.top + 40 }}>
          <EmptyState icon="help-circle" title="Task not found" subtitle="It may have been deleted." />
          <GradientButton title="Go back" variant="ghost" onPress={() => router.back()} style={{ marginHorizontal: spacing.xl }} />
        </View>
      </ScreenBackground>
    );
  }

  const priority = priorityMeta[task.priority];
  const category = categoryMeta[task.category];
  const overdue = isOverdue(task.deadline, task.completed);
  const now = new Date();
  const score = urgencyScore(task, now);

  // Each factor's contribution to the final score (matches smartSort weights).
  const factors = [
    { label: 'Deadline pressure', weight: 0.5, value: deadlinePressure(new Date(task.deadline), now), color: colors.danger },
    { label: 'Priority', weight: 0.3, value: PRIORITY_WEIGHT[task.priority], color: priority.color },
    { label: 'Schedule', weight: 0.2, value: schedulePressure(new Date(task.dateTime), now), color: colors.info },
  ];

  const onToggle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(toggleTask(task.id));
  };

  const onDelete = () => {
    Alert.alert('Delete task?', `"${task.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(deleteTask(task));
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => router.push({ pathname: '/task-form', params: { id: task.id } })}
            style={styles.iconBtn}
            accessibilityLabel="Edit task"
          >
            <Ionicons name="pencil" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.iconBtn, { backgroundColor: `${colors.danger}22` }]} accessibilityLabel="Delete task">
            <Ionicons name="trash" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Status + badges */}
        <View style={styles.badges}>
          <Badge
            icon={task.completed ? 'checkmark-circle' : overdue ? 'alert-circle' : 'ellipse-outline'}
            label={task.completed ? 'Completed' : overdue ? 'Overdue' : 'In progress'}
            color={task.completed ? colors.success : overdue ? colors.danger : colors.info}
          />
          <Badge icon={priority.icon} label={`${priority.label} priority`} color={priority.color} />
          <Badge icon={category.icon} label={category.label} color={category.color} />
        </View>

        <Text style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.description}>{task.description}</Text>
        ) : (
          <Text style={[styles.description, { fontStyle: 'italic', color: colors.textFaint }]}>No description</Text>
        )}

        {/* Timeline: scheduled → deadline */}
        <View style={styles.card}>
          <TimelineRow icon="time" color={colors.info} label="Scheduled" value={formatDateTime(task.dateTime)} sub={relativeToNow(task.dateTime)} />
          <View style={styles.timelineLine} />
          <TimelineRow
            icon="flag"
            color={overdue ? colors.danger : colors.warning}
            label="Deadline"
            value={formatDateTime(task.deadline)}
            sub={relativeToNow(task.deadline, true)}
          />
          {task.completedAt && (
            <>
              <View style={styles.timelineLine} />
              <TimelineRow icon="checkmark-done" color={colors.success} label="Completed" value={formatDateTime(task.completedAt)} sub={relativeToNow(task.completedAt)} />
            </>
          )}
        </View>

        {/* Smart score breakdown - explains the ranking on the home screen */}
        {!task.completed && (
          <View style={styles.card}>
            <View style={styles.scoreHead}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Smart urgency</Text>
              <Text style={styles.scoreValue}>{score.toFixed(2)}</Text>
            </View>
            <Text style={styles.scoreLevel}>Level: {urgencyLevel(score)}</Text>
            {factors.map((f) => (
              <View key={f.label} style={{ gap: 4 }}>
                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>
                    {f.label} <Text style={{ color: colors.textFaint }}>×{f.weight}</Text>
                  </Text>
                  <Text style={styles.factorValue}>{(f.value * f.weight).toFixed(2)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(f.value / 1.5, 1) * 100}%`, backgroundColor: f.color }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        <GradientButton
          title={task.completed ? 'Mark as active' : 'Mark as completed'}
          icon={task.completed ? 'refresh' : 'checkmark-done'}
          variant={task.completed ? 'ghost' : 'primary'}
          onPress={onToggle}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

function Badge({ icon, label, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1F`, borderColor: `${color}55` }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function TimelineRow(props: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string; value: string; sub: string }) {
  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineDot, { backgroundColor: `${props.color}22` }]}>
        <Ionicons name={props.icon} size={16} color={props.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timelineLabel}>{props.label}</Text>
        <Text style={styles.timelineValue}>{props.value}</Text>
      </View>
      <Text style={[styles.timelineSub, { color: props.color }]}>{props.sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { ...font.small, fontWeight: '700' },
  title: { ...font.h1, color: colors.text, marginTop: -spacing.sm },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  description: { ...font.body, color: colors.textMuted, lineHeight: 23, marginTop: -spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  cardTitle: { ...font.h3, color: colors.text, flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timelineDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, height: 14, backgroundColor: colors.border, marginLeft: 17, marginVertical: -6 },
  timelineLabel: { ...font.tiny, color: colors.textFaint, textTransform: 'uppercase' },
  timelineValue: { ...font.body, color: colors.text, fontWeight: '600' },
  timelineSub: { ...font.small, fontWeight: '700' },
  scoreHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreValue: { ...font.h2, color: colors.primary },
  scoreLevel: { ...font.small, color: colors.textMuted, marginTop: -spacing.sm, textTransform: 'capitalize' },
  factorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  factorLabel: { ...font.small, color: colors.textMuted },
  factorValue: { ...font.small, color: colors.text, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
