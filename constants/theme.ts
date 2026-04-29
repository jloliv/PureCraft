import { Platform } from 'react-native';

export const BACKGROUND_PRIMARY = '#F2EDE3';

export const Colors = {
  light: {
    text: '#1F2421',
    textMuted: '#6B7872',
    textSubtle: '#9AA39E',
    background: BACKGROUND_PRIMARY,
    surface: '#FAF7F1',
    surfaceAlt: '#F2EFE7',
    sage: '#7B9E89',
    sageDeep: '#5C7F6B',
    sageSoft: '#E4EDE5',
    cream: '#F7F2E7',
    creamDeep: '#EFE7D2',
    border: '#ECE8DE',
    tint: '#7B9E89',
    icon: '#6B7872',
    danger: '#C26B5A',
    success: '#7B9E89',
  },
  dark: {
    text: '#1F2421',
    textMuted: '#6B7872',
    textSubtle: '#9AA39E',
    background: BACKGROUND_PRIMARY,
    surface: '#FAF7F1',
    surfaceAlt: '#F2EFE7',
    sage: '#7B9E89',
    sageDeep: '#5C7F6B',
    sageSoft: '#E4EDE5',
    cream: '#F7F2E7',
    creamDeep: '#EFE7D2',
    border: '#ECE8DE',
    tint: '#7B9E89',
    icon: '#6B7872',
    danger: '#C26B5A',
    success: '#7B9E89',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const Type = {
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.1 },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.6 },
};

export const Shadow = {
  card: {
    shadowColor: '#1F2421',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#1F2421',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
