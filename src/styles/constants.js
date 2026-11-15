// Apple System Design constants for consistent styling across all pages

export const colors = {
  primary: {
    main: '#4e45e1',
    light: '#6B63F2',
    dark: '#4139BF',
    50: '#F5F5F7',
    100: '#EFEFF4',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#8179FF',
    500: '#6B63F2',
    600: '#4e45e1',
    700: '#4139BF',
    800: '#3634A3',
    900: '#1D1D1F'
  },
  gray: {
    50: '#F5F5F7',
    100: '#EFEFF4',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#AEAEB2',
    500: '#86868B',
    600: '#515154',
    700: '#3A3A3C',
    800: '#2C2C2E',
    900: '#1D1D1F'
  },
  white: '#ffffff',
  black: '#050507'
};

export const typography = {
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Inter', 'sans-serif'],
    mono: ['SF Mono', 'ui-monospace', 'JetBrains Mono', 'Menlo', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem'
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  lineHeight: {
    none: '1',
    tight: '1.15',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
};

export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem'
};

export const sectionSpacing = {
  small: 'py-12',
  medium: 'py-16',
  large: 'py-20',
  xlarge: 'py-24'
};

export const containers = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full'
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem',
  base: '0.5rem',
  md: '0.75rem',
  lg: '0.875rem',
  xl: '1.125rem',
  '2xl': '1.375rem',
  '3xl': '1.75rem',
  full: '9999px'
};

export const shadows = {
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl'
};

export const animations = {
  duration: {
    fast: 0.2,
    normal: 0.32,
    slow: 0.55,
    slower: 0.8
  },
  easing: {
    easeInOut: [0.22, 1, 0.36, 1],
    easeOut: [0.22, 1, 0.36, 1],
    easeIn: [0.4, 0, 1, 1]
  }
};

export const componentStyles = {
  card: {
    base: 'apple-card',
    padding: 'p-8',
    hover: 'apple-card-interactive'
  },
  button: {
    primary: 'apple-pill-btn font-semibold py-3 px-6 rounded-full',
    secondary: 'apple-secondary-btn font-semibold py-3 px-6 rounded-full',
    ghost: 'hover:bg-[var(--apple-surface-subcard-hover)] text-[var(--apple-text-primary)] font-semibold py-3 px-6 rounded-full transition-colors duration-200'
  },
  input: {
    base: 'w-full px-4 py-3 apple-input'
  }
};

export const layout = {
  grid: {
    cols2: 'grid md:grid-cols-2 gap-8',
    cols3: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
    cols4: 'grid md:grid-cols-2 lg:grid-cols-4 gap-8'
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start'
  }
};
