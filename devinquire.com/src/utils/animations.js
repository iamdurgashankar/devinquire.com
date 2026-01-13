// Standardized animation configurations for consistent motion across all pages
import { animations } from '../styles/constants';

// Common animation variants
export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  }
};

export const fadeInLeft = {
  hidden: { 
    opacity: 0, 
    x: -50 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  }
};

export const fadeInRight = {
  hidden: { 
    opacity: 0, 
    x: 50 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  }
};

export const scaleIn = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: animations.duration.normal,
      ease: animations.easing.easeOut
    }
  }
};

export const slideInUp = {
  hidden: { 
    opacity: 0, 
    y: 100 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  }
};

// Container variants for staggered animations
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: animations.duration.normal
    }
  }
};

// Hero section animations
export const heroTitle = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  }
};

export const heroSubtitle = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: animations.duration.slow,
      delay: 0.2,
      ease: animations.easing.easeOut
    }
  }
};

// Card hover animations
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0,
    transition: {
      duration: animations.duration.fast,
      ease: animations.easing.easeInOut
    }
  },
  hover: { 
    scale: 1.02,
    y: -5,
    transition: {
      duration: animations.duration.fast,
      ease: animations.easing.easeInOut
    }
  }
};

// Button animations
export const buttonHover = {
  rest: { 
    scale: 1,
    transition: {
      duration: animations.duration.fast
    }
  },
  hover: { 
    scale: 1.05,
    transition: {
      duration: animations.duration.fast
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: animations.duration.fast
    }
  }
};

// Icon animations
export const iconFloat = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: animations.easing.easeInOut
    }
  }
};

export const iconRotate = {
  animate: {
    rotate: [0, 10, -10, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: animations.easing.easeInOut
    }
  }
};

// Page transition animations
export const pageTransition = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: animations.duration.normal,
      ease: animations.easing.easeIn
    }
  }
};

// Loading animations
export const loadingSpinner = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const loadingPulse = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: animations.easing.easeInOut
    }
  }
};

// Form animations
export const formFieldFocus = {
  focus: {
    scale: 1.02,
    transition: {
      duration: animations.duration.fast
    }
  },
  blur: {
    scale: 1,
    transition: {
      duration: animations.duration.fast
    }
  }
};

// Navigation animations
export const navItemHover = {
  rest: {
    scale: 1,
    color: "#6b7280"
  },
  hover: {
    scale: 1.05,
    color: "#0077b6",
    transition: {
      duration: animations.duration.fast
    }
  }
};

// Modal animations
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: animations.duration.normal
    }
  }
};

export const modalContent = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: animations.duration.normal,
      ease: animations.easing.easeOut
    }
  }
};

// Utility functions for creating custom animations
export const createStaggerAnimation = (staggerDelay = 0.1, childDelay = 0.1) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: childDelay
    }
  }
});

export const createDelayedAnimation = (delay = 0, duration = animations.duration.normal) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      delay,
      ease: animations.easing.easeOut
    }
  }
});

// Viewport configuration for consistent scroll-triggered animations
export const defaultViewport = {
  once: true,
  margin: "-100px"
};

export const lazyViewport = {
  once: true,
  margin: "-200px"
};