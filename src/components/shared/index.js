// Shared UI components for consistent styling across all pages
import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, sectionSpacing, containers } from '../../styles/constants';
import { fadeInUp, scaleIn, cardHover, buttonHover, defaultViewport } from '../../utils/animations';
import { responsiveContainers, responsiveSpacing, responsiveTypography, responsiveComponents } from '../../utils/responsive';

// Reusable Section Container
export const Section = ({ children, spacing = 'large', container = 'standard', className = '', ...props }) => {
  const getSpacingClass = () => {
    switch (spacing) {
      case 'small': return responsiveSpacing.sectionPaddingSmall;
      case 'large': return responsiveSpacing.sectionPaddingLarge;
      default: return responsiveSpacing.sectionPadding;
    }
  };
  
  const containerClass = responsiveContainers[container] || responsiveContainers.standard;
  
  return (
    <section className={`${getSpacingClass()} ${className}`} {...props}>
      <div className={containerClass}>
        {children}
      </div>
    </section>
  );
};

// Animated Section with consistent motion
export const AnimatedSection = ({ children, delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <Section {...props}>
        {children}
      </Section>
    </motion.div>
  );
};

// Consistent Card Component
export const Card = ({ children, hover = true, padding = 'default', className = '', ...props }) => {
  const baseClasses = componentStyles.card.base;
  const getPaddingClass = () => {
    switch (padding) {
      case 'small': return responsiveComponents.cardPaddingSmall;
      case 'large': return responsiveComponents.cardPaddingLarge;
      default: return responsiveComponents.cardPadding;
    }
  };
  const hoverClasses = hover ? componentStyles.card.hover : '';
  
  return (
    <div className={`${baseClasses} ${getPaddingClass()} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Animated Card
export const AnimatedCard = ({ children, delay = 0, hover = true, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      {...(hover && {
        variants: { ...animationVariant, ...cardHover },
        initial: "hidden",
        whileInView: "visible",
        whileHover: "hover",
        animate: "rest"
      })}
    >
      <Card hover={hover} {...props}>
        {children}
      </Card>
    </motion.div>
  );
};

// Consistent Button Components
export const Button = ({ variant = 'primary', children, className = '', animated = true, ...props }) => {
  const variantClasses = componentStyles.button[variant] || componentStyles.button.primary;
  
  if (animated) {
    return (
      <motion.button 
        className={`${variantClasses} ${className}`}
        variants={buttonHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        {children}
      </motion.button>
    );
  }
  
  return (
    <button className={`${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Consistent Input Component
export const Input = ({ className = '', ...props }) => {
  return (
    <input className={`${componentStyles.input.base} ${className}`} {...props} />
  );
};

// Consistent Textarea Component
export const Textarea = ({ className = '', ...props }) => {
  return (
    <textarea className={`${componentStyles.input.base} ${className}`} {...props} />
  );
};

// Section Title Component
export const SectionTitle = ({ title, subtitle, centered = true, className = '' }) => {
  const alignmentClass = centered ? 'text-center' : '';
  
  return (
    <div className={`${responsiveSpacing.marginBottomLarge} ${alignmentClass} ${className}`}>
      <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-4`}>{title}</h2>
      {subtitle && (
        <p className={`${responsiveTypography.sectionSubtitle} text-gray-600 max-w-3xl mx-auto`}>{subtitle}</p>
      )}
    </div>
  );
};

// Animated Section Title
export const AnimatedSectionTitle = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <SectionTitle {...props} />
    </motion.div>
  );
};

// Grid Container for consistent layouts
export const Grid = ({ cols = 3, children, className = '', responsive = true }) => {
  const getGridClasses = () => {
    if (!responsive) {
      return `grid grid-cols-${cols}`;
    }
    
    switch (cols) {
      case 2:
        return 'grid grid-cols-1 lg:grid-cols-2';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };
  
  return (
    <div className={`${getGridClasses()} ${responsiveSpacing.gap} ${className}`}>
      {children}
    </div>
  );
};

// Stats Component for consistent number displays
export const StatCard = ({ number, label, suffix = '', className = '' }) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#4e45e1] mb-2">
        {number}{suffix}
      </div>
      <div className={`${responsiveTypography.bodyBase} text-gray-600 font-medium`}>{label}</div>
    </div>
  );
};

// Animated Stats
export const AnimatedStatCard = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...scaleIn,
    visible: {
      ...scaleIn.visible,
      transition: {
        ...scaleIn.visible.transition,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <StatCard {...props} />
    </motion.div>
  );
};

// Feature Card for services/products
export const FeatureCard = ({ icon: Icon, title, description, features = [], className = '' }) => {
  return (
    <Card className={className}>
      <div className="text-center">
        <div className={`${responsiveComponents.iconSizeLarge} bg-[#4e45e1] rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`${responsiveComponents.iconSize} text-white`} />
        </div>
        <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-4`}>{title}</h3>
        <p className={`${responsiveTypography.bodyBase} text-gray-600 mb-6`}>{description}</p>
        {features.length > 0 && (
          <ul className="text-left space-y-2">
            {features.map((feature, index) => (
              <li key={index} className={`flex items-center ${responsiveTypography.bodySmall} text-gray-700`}>
                <div className="w-2 h-2 bg-[#4e45e1] rounded-full mr-3 flex-shrink-0"></div>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

// Animated Feature Card
export const AnimatedFeatureCard = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <FeatureCard {...props} />
    </motion.div>
  );
};