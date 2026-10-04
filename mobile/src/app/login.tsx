import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../components/ScreenBackground';
import { AuthHeader } from '../components/AuthHeader';
import { TextField } from '../components/TextField';
import { GradientButton } from '../components/GradientButton';
import { useAppDispatch, useAppSelector } from '../store';
import { clearAuthError, login } from '../store/authSlice';
import { FormError } from '../components/FormError';
import { colors, font, spacing } from '../theme';
import { isValidEmail } from '../utils/validation';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { submitting, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const passwordRef = useRef<TextInput>(null);

  // Don't show a stale server error from a previous attempt / other screen.
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async () => {
    // Client-side validation first - instant feedback, no network round trip.
    const errors: typeof fieldErrors = {};
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const result = await dispatch(login({ email, password }));
    Haptics.notificationAsync(
      login.fulfilled.match(result) ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    // On success the root layout's auth guard swaps us into the app automatically.
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title="Welcome back" subtitle="Log in to pick up right where you left off." />

          <View style={styles.form}>
            <TextField
              label="Email"
              icon="mail"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={fieldErrors.email}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              icon="lock-closed"
              placeholder="Your password"
              password
              autoComplete="password"
              returnKeyType="go"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              error={fieldErrors.password}
            />

            <FormError message={error} />

            <GradientButton title="Log in" icon="log-in" onPress={onSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to TaskFlow? </Text>
            <Link href="/register" replace style={styles.link}>
              Create an account
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: spacing.xxl },
  footerText: { ...font.body, color: colors.textMuted },
  link: { ...font.body, color: colors.primary, fontWeight: '700' },
});
