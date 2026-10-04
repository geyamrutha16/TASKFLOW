import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '../types';
import { categoryMeta, colors, font, priorityMeta, radius, spacing } from '../theme';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { formatDateTime, isOverdue, relativeToNow } from '../utils/dates';
import { urgencyLevel, urgencyScore } from '../utils/smartSort';

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPress: (task: Task) => void;
}

const URGENCY_COLOR = {
  critical: colors.danger,
  high: colors.warning,
  moderate: colors.info,
  relaxed: colors.success,
};

/**
 * One row in the task list.
 * Left edge = priority colour strip, bottom = urgency "heat" bar from the
 * smart-sort score, so users can see *why* a task is ranked where it is.
 * Wrapped in memo so toggling one task doesn't re-render the whole list.
 */
export const TaskCard = memo(function TaskCard({ task, onToggle, onDelete, onPress }: Props) {
  const priority = priorityMeta[task.priority];
  const category = categoryMeta[task.category];
  const overdue = isOverdue(task.deadline, task.completed);
  const score = urgencyScore(task);
  const heatColor = URGENCY_COLOR[urgencyLevel(score)];

  return (
    <Pressable
      onPress={() => onPress(task)}
      style={({ pressed }) => [styles.card, task.completed && styles.cardDone, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      <View style={[styles.strip, { backgroundColor: priority.color }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <AnimatedCheckbox checked={task.completed} onToggle={() => onToggle(task)} color={priority.color} />

          <View style={styles.titleBox}>
            <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={1}>
              {task.title}
            </Text>
            {!!task.description && (
              <Text style={styles.description} numberOfLines={1}>
                {task.description}
              </Text>
            )}
          </View>

          <Pressable onPress={() => onDelete(task)} hitSlop={12} accessibilityLabel={`Delete ${task.title}`} style={styles.trash}>
            <Ionicons name="trash-outline" size={18} color={colors.textFaint} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: `${priority.color}1F` }]}>
            <Ionicons name={priority.icon} size={11} color={priority.color} />
            <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${category.color}1F` }]}>
            <Ionicons name={category.icon} size={11} color={category.color} />
            <Text style={[styles.badgeText, { color: category.color }]}>{category.label}</Text>
          </View>

          <View style={styles.spacer} />

          {task.completed ? (
            <Text style={[styles.due, { color: colors.success }]}>
              ✓ Done {task.completedAt ? relativeToNow(task.completedAt) : ''}
            </Text>
          ) : (
            <View style={styles.dueBox}>
              <Ionicons name={overdue ? 'alert-circle' : 'flag'} size={12} color={overdue ? colors.danger : colors.textMuted} />
              <Text style={[styles.due, overdue && { color: colors.danger, fontWeight: '700' }]}>
                {relativeToNow(task.deadline, true)}
              </Text>
            </View>
          )}
        </View>

        {!task.completed && (
          <>
            <Text style={styles.schedule}>
              <Ionicons name="time-outline" size={11} color={colors.textFaint} /> {formatDateTime(task.dateTime)}
            </Text>
            {/* Urgency heat bar - width proportional to the smart score */}
            <View style={styles.heatTrack}>
              <View style={[styles.heatFill, { width: `${Math.min(score / 1.25, 1) * 100}%`, backgroundColor: heatColor }]} />
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardDone: { opacity: 0.55 },
  strip: { width: 4 },
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleBox: { flex: 1 },
  title: { ...font.h3, color: colors.text },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  description: { ...font.small, color: colors.textMuted, marginTop: 2 },
  trash: { padding: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  spacer: { flex: 1 },
  dueBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  due: { ...font.small, color: colors.textMuted },
  schedule: { ...font.small, color: colors.textFaint, marginTop: -4 },
  heatTrack: { height: 3, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  heatFill: { height: '100%', borderRadius: 2 },
});
