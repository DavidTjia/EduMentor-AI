/**
 * EduMentor AI Design System
 * Color palette, typography, spacing, and radius tokens.
 */

export const AppColors = {
  primary: '#6C63FF',       // violet
  primaryDark: '#4B44CC',
  primaryLight: '#EAE8FF',
  accent: '#4ECDC4',        // teal
  accentLight: '#E0FAF8',
  success: '#52C97A',
  warning: '#FFB347',
  danger: '#FF6B6B',
  background: '#F0F2FF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8EAFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  tabBar: '#FFFFFF',
  overlay: 'rgba(108,99,255,0.08)',
};

export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const AppFonts = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

/** Legacy Colors kept for existing component compatibility */
export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textMuted,
    tabIconSelected: AppColors.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};
