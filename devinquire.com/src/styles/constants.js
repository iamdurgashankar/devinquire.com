// Design system constants for consistent styling across all pages

// Color palette
export const colors = {
  primary: {
    main: '#6366f1', // Indigo
    light: '#818cf8',
    dark: '#4f46e5',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca'
  },
  violet: {
    main: '#8b5cf6',
    500: '#8b5cf6',
    600: '#7c3aed'
  },
  accent: {
    main: '#06b6d4', // Cyan
    500: '#06b6d4',
    600: '#0891b2'
  },
  mesh: {
    dark: '#0a0a0c',
    light: '#f8fafc'
  }
};

// Typography scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem'      // 128px
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
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
};

// Spacing scale (consistent with Tailwind)
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
};

// Section spacing standards
export const sectionSpacing = {
  small: 'py-12',     // 48px top/bottom
  medium: 'py-16',    // 64px top/bottom
  large: 'py-20',     // 80px top/bottom
  xlarge: 'py-24'     // 96px top/bottom
};

// Container max widths
export const containers = {
  sm: 'max-w-2xl',    // 672px
  md: 'max-w-4xl',    // 896px
  lg: 'max-w-6xl',    // 1152px
  xl: 'max-w-7xl',    // 1280px
  full: 'max-w-full'
};

// Border radius standards
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  base: '0.25rem',    // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px'
};

// Shadow standards
export const shadows = {
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl'
};

// Animation durations
export const animations = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8
  },
  easing: {
    easeInOut: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1]
  }
};

// Common component styles
export const componentStyles = {
  card: {
    base: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    padding: 'p-8',
    hover: 'hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1'
  },
  button: {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10 font-semibold py-3 px-8 rounded-xl transition-all duration-300 active:scale-95',
    ghost: 'hover:bg-white/5 text-gray-300 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300'
  }
};

// Grid and layout standards
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