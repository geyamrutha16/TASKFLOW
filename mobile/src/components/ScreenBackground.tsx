import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

/**
 * Full-screen dark backdrop with two soft neon "glow orbs".
 * Gives every screen the same atmospheric look without images.
 */
export function ScreenBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(124,92,255,0.35)', 'transparent']}
        style={[styles.orb, styles.orbTop]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(255,92,168,0.22)', 'transparent']}
        style={[styles.orb, styles.orbBottom]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0, y: 0 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  orb: { position: 'absolute', width: 420, height: 420, borderRadius: 210 },
  orbTop: { top: -200, right: -160 },
  orbBottom: { bottom: -220, left: -180 },
});
