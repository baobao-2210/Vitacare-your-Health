/**
 * VitaCare Mobile Design Theme
 * Extracted directly from Google Stitch Project ("Quản Lý Sức Khỏe")
 */
export const Colors = {
  // Brand colors
  primary: '#00685f',
  primaryContainer: '#008378',
  primaryFixed: '#89f5e7',
  primaryFixedDim: '#6cd9cb',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f4fffc',
  onPrimaryFixed: '#00201d',
  onPrimaryFixedVariant: '#005049',
  
  // Secondary (Sky / Water)
  secondary: '#006591',
  secondaryContainer: '#39b8fd',
  secondaryFixed: '#c9e6ff',
  secondaryFixedDim: '#90cdfa',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#001e30',
  onSecondaryFixed: '#001e30',
  onSecondaryFixedVariant: '#004b6f',
  
  // Tertiary (Amber / Alert / Warmth)
  tertiary: '#825100',
  tertiaryContainer: '#a36700',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#f5ba73',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#2c1700',
  onTertiaryFixed: '#2c1700',
  onTertiaryFixedVariant: '#673d00',
  
  // Surfaces & Backgrounds
  background: '#faf8ff',
  surface: '#faf8ff',
  surfaceVariant: '#dae2fd',
  card: '#ffffff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',
  surfaceDim: '#d5daf5',
  surfaceBright: '#faf8ff',

  // On Surface & Content
  onSurface: '#131b2e',
  onSurfaceVariant: '#3d4947',
  text: '#131b2e',
  textSecondary: '#3d4947',
  textMuted: '#6d7a77',
  border: '#bcc9c6',
  outline: '#6d7a77',
  outlineVariant: '#bcc9c6',
  inverseSurface: '#2e3130',
  inverseOnSurface: '#eff1ee',
  inversePrimary: '#6bd8cb',
  
  // Statuses
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#410002',
  warning: '#f59e0b',
  success: '#008378',
  info: '#006591',

  dark: {
    primary: '#6bd8cb',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',
    text: '#faf8ff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  gutter: 16,
  margin: 20,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 36,
} as const;

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Typography = {
  fontFamily: {
    headline: 'Plus Jakarta Sans',
    body: 'Be Vietnam Pro',
  },
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '700' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '700' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
