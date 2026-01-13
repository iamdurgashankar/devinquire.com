// Responsive design utilities for consistent breakpoints and patterns

// Standard breakpoints (matching Tailwind CSS)
export const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices (large desktops)
  '2xl': '1536px' // 2X large devices (larger desktops)
};

// Responsive grid patterns
export const responsiveGrids = {
  // 1 column on mobile, 2 on tablet, 3 on desktop
  cols123: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8',
  
  // 1 column on mobile, 2 on tablet, 4 on desktop
  cols124: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8',
  
  // 1 column on mobile, 2 on desktop
  cols12: 'grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12',
  
  // 2 columns on mobile, 3 on tablet, 4 on desktop
  cols234: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8',
  
  // Auto-fit responsive grid
  autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 md:gap-8'
};

// Responsive spacing patterns
export const responsiveSpacing = {
  // Section padding
  sectionPadding: 'py-12 md:py-16 lg:py-20 xl:py-24',
  sectionPaddingSmall: 'py-8 md:py-12 lg:py-16',
  sectionPaddingLarge: 'py-16 md:py-20 lg:py-24 xl:py-32',
  
  // Container padding
  containerPadding: 'px-4 sm:px-6 lg:px-8',
  
  // Margin spacing
  marginBottom: 'mb-8 md:mb-12 lg:mb-16',
  marginBottomSmall: 'mb-4 md:mb-6 lg:mb-8',
  marginBottomLarge: 'mb-12 md:mb-16 lg:mb-20',
  
  // Gap spacing
  gap: 'gap-4 md:gap-6 lg:gap-8',
  gapSmall: 'gap-2 md:gap-3 lg:gap-4',
  gapLarge: 'gap-6 md:gap-8 lg:gap-12'
};

// Responsive typography
export const responsiveTypography = {
  // Hero titles
  heroTitle: 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight',
  heroSubtitle: 'text-lg md:text-xl lg:text-2xl leading-relaxed',
  
  // Section titles
  sectionTitle: 'text-2xl md:text-3xl lg:text-4xl font-bold',
  sectionSubtitle: 'text-base md:text-lg lg:text-xl',
  
  // Card titles
  cardTitle: 'text-lg md:text-xl lg:text-2xl font-bold',
  cardText: 'text-sm md:text-base',
  
  // Body text
  bodyLarge: 'text-base md:text-lg',
  bodyBase: 'text-sm md:text-base',
  bodySmall: 'text-xs md:text-sm'
};

// Responsive layout patterns
export const responsiveLayouts = {
  // Flex layouts
  flexCenter: 'flex flex-col md:flex-row items-center justify-center',
  flexBetween: 'flex flex-col md:flex-row items-center justify-between',
  flexStart: 'flex flex-col md:flex-row items-start',
  
  // Text alignment
  textCenter: 'text-center md:text-left',
  textCenterMobile: 'text-center lg:text-left',
  
  // Width constraints
  maxWidthResponsive: 'max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl',
  maxWidthFull: 'max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl',
  
  // Height patterns
  minHeightScreen: 'min-h-screen',
  minHeightHalf: 'min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh]'
};

// Responsive component sizes
export const responsiveComponents = {
  // Buttons
  buttonSize: 'px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4',
  buttonSizeSmall: 'px-3 py-1.5 md:px-4 md:py-2',
  buttonSizeLarge: 'px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5',
  
  // Cards
  cardPadding: 'p-4 md:p-6 lg:p-8',
  cardPaddingSmall: 'p-3 md:p-4 lg:p-6',
  cardPaddingLarge: 'p-6 md:p-8 lg:p-10',
  
  // Icons
  iconSize: 'w-6 h-6 md:w-8 md:h-8',
  iconSizeSmall: 'w-4 h-4 md:w-5 md:h-5',
  iconSizeLarge: 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12',
  
  // Images
  imageSize: 'w-full h-48 md:h-56 lg:h-64 object-cover',
  avatarSize: 'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20'
};

// Navigation responsive patterns
export const responsiveNavigation = {
  // Mobile menu
  mobileMenu: 'block md:hidden',
  desktopMenu: 'hidden md:block',
  
  // Navigation spacing
  navPadding: 'px-4 sm:px-6 lg:px-8 py-4',
  navItemSpacing: 'space-x-4 md:space-x-6 lg:space-x-8',
  
  // Logo sizing
  logoSize: 'h-8 md:h-10 lg:h-12'
};

// Form responsive patterns
export const responsiveForms = {
  // Input sizing
  inputPadding: 'px-3 py-2 md:px-4 md:py-3',
  inputText: 'text-sm md:text-base',
  
  // Form layouts
  formGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
  formSpacing: 'space-y-4 md:space-y-6',
  
  // Label sizing
  labelText: 'text-sm md:text-base font-medium'
};

// Media query utilities for JavaScript
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,
  
  // Max width queries
  maxSm: `(max-width: ${parseInt(breakpoints.sm) - 1}px)`,
  maxMd: `(max-width: ${parseInt(breakpoints.md) - 1}px)`,
  maxLg: `(max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  maxXl: `(max-width: ${parseInt(breakpoints.xl) - 1}px)`
};

// Responsive animation delays for staggered effects
export const responsiveAnimationDelays = {
  mobile: 0.1,   // Faster on mobile
  tablet: 0.15,  // Medium on tablet
  desktop: 0.2   // Slower on desktop for better effect
};

// Utility functions
export const getResponsiveDelay = () => {
  if (typeof window === 'undefined') return responsiveAnimationDelays.desktop;
  
  const width = window.innerWidth;
  if (width < parseInt(breakpoints.md)) return responsiveAnimationDelays.mobile;
  if (width < parseInt(breakpoints.lg)) return responsiveAnimationDelays.tablet;
  return responsiveAnimationDelays.desktop;
};

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < parseInt(breakpoints.md);
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= parseInt(breakpoints.md) && width < parseInt(breakpoints.lg);
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= parseInt(breakpoints.lg);
};

// Responsive container classes
export const responsiveContainers = {
  // Standard container with responsive max-widths
  standard: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Narrow container for text-heavy content
  narrow: 'w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Wide container for full-width sections
  wide: 'w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Full width container
  full: 'w-full px-4 sm:px-6 lg:px-8'
};

// Export commonly used responsive class combinations
export const commonResponsiveClasses = {
  // Hero section
  heroSection: `${responsiveSpacing.sectionPaddingLarge} ${responsiveContainers.standard}`,
  
  // Content section
  contentSection: `${responsiveSpacing.sectionPadding} ${responsiveContainers.standard}`,
  
  // Card grid
  cardGrid: `${responsiveGrids.cols123} ${responsiveSpacing.gap}`,
  
  // Feature grid
  featureGrid: `${responsiveGrids.cols124} ${responsiveSpacing.gap}`,
  
  // Two column layout
  twoColumn: `${responsiveGrids.cols12} ${responsiveSpacing.gapLarge}`
};