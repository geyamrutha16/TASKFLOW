import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { store, useAppDispatch, useAppSelector } from '../store';
import { restoreSession } from '../store/authSlice';
import { colors, font, gradients } from '../theme';

/** App root: provides the Redux store to every screen. */
export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <RootNavigator />
    </Provider>
  );
}

/**
 * Navigation + authentication flow.
 * `Stack.Protected` only exposes the screens whose `guard` is true, so:
 *   - logged out → only login/register exist (index redirects to login)
 *   - logged in  → only the app screens exist
 * When the auth state flips (login, logout, expired token) Expo Router
 * automatically moves the user to the right place and clears history.
 */
function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  // Try to resume a previous session once on launch.
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (status === 'restoring') return <Splash />;

  const isLoggedIn = status === 'authenticated';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="task-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

/** Branded loading screen shown while the saved session is being checked. */
function Splash() {
  return (
    <View style={styles.splash}>
      <LinearGradient colors={gradients.primary} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name="checkmark-done" size={44} color={colors.text} />
      </LinearGradient>
      <Text style={styles.brand}>TaskFlow</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  brand: { ...font.h1, color: colors.text, marginTop: 16 },
});
