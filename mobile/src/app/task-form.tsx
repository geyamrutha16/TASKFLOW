import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../components/ScreenBackground';
import { TextField } from '../components/TextField';
import { DateTimeField } from '../components/DateTimeField';
import { Chip } from '../components/Chip';
import { GradientButton } from '../components/GradientButton';
import { FormError } from '../components/FormError';
import { useAppDispatch, useAppSelector } from '../store';
import { createTask, selectTaskById, updateTask } from '../store/tasksSlice';
import { categoryMeta, colors, font, priorityMeta, spacing } from '../theme';
import type { Category, Priority, TaskInput } from '../types';
import { nextQuarterHour } from '../utils/dates';

const HOUR = 3_600_000;

/** One-tap deadline shortcuts, computed relative to the scheduled time. */
const DEADLINE_PRESETS: { label: string; compute: (start: Date) => Date }[] = [
  { label: '+1 hour', compute: (s) => new Date(s.getTime() + HOUR) },
  { label: '+3 hours', compute: (s) => new Date(s.getTime() + 3 * HOUR) },
  {
    label: 'End of day',
    compute: (s) => {
      const d = new Date(s);
      d.setHours(23, 59, 0, 0);
      return d.getTime() > s.getTime() ? d : new Date(s.getTime() + HOUR);
    },
  },
  { label: '+1 day', compute: (s) => new Date(s.getTime() + 24 * HOUR) },
  { label: '+1 week', compute: (s) => new Date(s.getTime() + 7 * 24 * HOUR) },
];

/**
 * Create OR edit a task.
 *   /task-form          → new task
 *   /task-form?id=abc   → edit task "abc" (pre-filled from the store)
 */
export default function TaskFormScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useAppSelector((s) => (id ? selectTaskById(s, id) : undefined));
  const isEdit = !!existing;

  // Form state, initialised from the task being edited or sensible defaults.
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [dateTime, setDateTime] = useState(() => (existing ? new Date(existing.dateTime) : nextQuarterHour()));
  const [deadline, setDeadline] = useState(() =>
    existing ? new Date(existing.deadline) : new Date(nextQuarterHour().getTime() + 24 * HOUR),
  );
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'personal');

  const [errors, setErrors] = useState<{ title?: string; deadline?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Moving the start past the deadline drags the deadline along with it. */
  const onChangeDateTime = (d: Date) => {
    setDateTime(d);
    if (deadline.getTime() < d.getTime()) setDeadline(new Date(d.getTime() + HOUR));
  };

  const onSave = async () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Give your task a title';
    if (deadline.getTime() < dateTime.getTime()) next.deadline = 'Deadline must be after the start time';
    setErrors(next);
    if (Object.keys(next).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const input: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      dateTime: dateTime.toISOString(),
      deadline: deadline.toISOString(),
      priority,
      category,
    };

    setSaving(true);
    setServerError(null);
    const result = isEdit
      ? await dispatch(updateTask({ id: existing.id, changes: input }))
      : await dispatch(createTask(input));
    setSaving(false);

    if (createTask.rejected.match(result) || updateTask.rejected.match(result)) {
      setServerError(result.payload ?? 'Could not save task');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScreenBackground>
      {/* Modal header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit task' : 'New task'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Title"
            icon="create"
            placeholder="What needs doing?"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
            }}
            error={errors.title}
            maxLength={120}
            autoFocus={!isEdit}
          />

          <TextField
            label="Description"
            icon="document-text"
            placeholder="Add details, links, notes… (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={1000}
          />

          {/* Priority */}
          <View style={styles.group}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {(Object.keys(priorityMeta) as Priority[]).reverse().map((p) => (
                <Chip
                  key={p}
                  label={priorityMeta[p].label}
                  icon={priorityMeta[p].icon}
                  color={priorityMeta[p].color}
                  selected={priority === p}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPriority(p);
                  }}
                />
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.group}>
            <Text style={styles.label}>Category</Text>
            <View style={[styles.row, styles.wrap]}>
              {(Object.keys(categoryMeta) as Category[]).map((c) => (
                <Chip
                  key={c}
                  label={categoryMeta[c].label}
                  icon={categoryMeta[c].icon}
                  color={categoryMeta[c].color}
                  selected={category === c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(c);
                  }}
                />
              ))}
            </View>
          </View>

          <DateTimeField label="Scheduled for" icon="time" value={dateTime} onChange={onChangeDateTime} />

          <View style={styles.group}>
            <DateTimeField
              label="Deadline"
              icon="flag"
              value={deadline}
              minimumDate={dateTime}
              onChange={(d) => {
                setDeadline(d);
                if (errors.deadline) setErrors((e) => ({ ...e, deadline: undefined }));
              }}
              error={errors.deadline}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {DEADLINE_PRESETS.map((p) => (
                <Chip
                  key={p.label}
                  size="sm"
                  label={p.label}
                  icon="flash"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDeadline(p.compute(dateTime));
                    setErrors((e) => ({ ...e, deadline: undefined }));
                  }}
                />
              ))}
            </ScrollView>
          </View>

          <FormError message={serverError} />

          <GradientButton
            title={isEdit ? 'Save changes' : 'Create task'}
            icon={isEdit ? 'checkmark' : 'add'}
            onPress={onSave}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...font.h2, color: colors.text },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.md },
  group: { gap: spacing.sm },
  label: { ...font.tiny, color: colors.textMuted, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexWrap: 'wrap' },
});
