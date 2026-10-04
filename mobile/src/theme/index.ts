import type { Ionicons } from '@expo/vector-icons';
import type { Category, Priority } from '../types';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Design tokens. Every colour, radius and spacing value in the app comes
 * from here so the look stays consistent and is easy to re-skin.
 * Theme: "Midnight Neon" - deep indigo surfaces with violet→pink accents.
 */
export const colors = {
  bg: '#0B0B1A',
  surface: '#15152B',
  surfaceAlt: '#1E1E3A',
  border: 'rgba(255,255,255,0.08)',
  text: '#F4F4FF',
  textMuted: '#9A9AC0',
  textFaint: '#6B6B90',
  primary: '#8B5CFF',
  success: '#2EE6A6',
  warning: '#FFB547',
  danger: '#FF5C7A',
  info: '#4CC9F0',
  overlay: 'rgba(5,5,15,0.6)',
};

/** Brand gradient used for primary buttons, headers and the FAB. */
export const gradients = {
  primary: ['#7C5CFF', '#C651FF', '#FF5CA8'] as const,
  surface: ['#1A1A35', '#121226'] as const,
  success: ['#2EE6A6', '#1FB6D9'] as const,
  danger: ['#FF5C7A', '#FF8A5C'] as const,
};

export const priorityMeta: Record<Priority, { label: string; color: string; icon: IconName }> = {
  high: { label: 'High', color: colors.danger, icon: 'flame' },
  medium: { label: 'Medium', color: colors.warning, icon: 'flash' },
  low: { label: 'Low', color: colors.success, icon: 'leaf' },
};

export const categoryMeta: Record<Category, { label: string; icon: IconName; color: string }> = {
  personal: { label: 'Personal', icon: 'person', color: '#C651FF' },
  work: { label: 'Work', icon: 'briefcase', color: '#4CC9F0' },
  study: { label: 'Study', icon: 'school', color: '#FFB547' },
  health: { label: 'Health', icon: 'heart', color: '#2EE6A6' },
  other: { label: 'Other', icon: 'apps', color: '#9A9AC0' },
};

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6 },
};
