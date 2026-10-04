import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../components/ScreenBackground';
import { AuthHeader } from '../components/AuthHeader';
import { TextField } from '../components/TextField';
import { GradientButton } from '../components/GradientButton';
import { FormError } from '../components/FormError';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, register } from '../store/authSlice';
import { colors, font, spacing } from '../theme';
import { isValidEmail, passwordError, passwordStrength } from '../utils/validation';

const STRENGTH_COLORS = [colors.danger, colors.danger, colors.warning, colors.info, colors.success];

type Field = 'name' | 'email' | 'password' | 'confirm';

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { submitting, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState<Record<Field, string>>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const set = (field: Field) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear a field's error as soon as the user starts fixing it.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const strength = passwordStrength(form.password);

  const onSubmit = async () => {
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    next.password = passwordError(form.password);
    if (form.confirm !== form.password) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const result = await dispatch(register({ name: form.name, email: form.email, password: form.password }));
    if (register.fulfilled.match(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title="Create account" subtitle="Organise your day with smart, priority-aware task lists." />

          <View style={styles.form}>
            <TextField
              label="Name"
              icon="person"
              placeholder="Jane Doe"
              autoComplete="name"
              returnKeyType="next"
              value={form.name}
              onChangeText={set('name')}
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name}
            />
            <TextField
              ref={emailRef}
              label="Email"
              icon="mail"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              value={form.email}
              onChangeText={set('email')}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
            />
            <View style={{ gap: spacing.sm }}>
              <TextField
                ref={passwordRef}
                label="Password"
                icon="lock-closed"
                placeholder="At least 6 characters, incl. a number"
                password
                autoComplete="new-password"
                returnKeyType="next"
                value={form.password}
                onChangeText={set('password')}
                onSubmitEditing={() => confirmRef.current?.focus()}
                error={errors.password}
              />
              {/* Live password strength meter */}
              {!!form.password && (
                <View style={styles.strengthRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i < strength.score ? STRENGTH_COLORS[strength.score] : colors.surfaceAlt },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength.score] }]}>{strength.label}</Text>
                </View>
              )}
            </View>
            <TextField
              ref={confirmRef}
              label="Confirm password"
              icon="shield-checkmark"
              placeholder="Repeat your password"
              password
              returnKeyType="go"
              value={form.confirm}
              onChangeText={set('confirm')}
              onSubmitEditing={onSubmit}
              error={errors.confirm}
            />

            <FormError message={error} />

            <GradientButton title="Create account" icon="sparkles" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" replace style={styles.link}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.xl },
  form: { gap: spacing.lg },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { ...font.small, width: 70, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: spacing.xxl },
  footerText: { ...font.body, color: colors.textMuted },
  link: { ...font.body, color: colors.primary, fontWeight: '700' },
});
