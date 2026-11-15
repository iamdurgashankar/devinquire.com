// Shared Apple System UI components for consistent styling across all pages
import React from "react";
import { motion } from "framer-motion";
import { componentStyles } from "../../styles/constants";
import {
  fadeInUp,
  scaleIn,
  cardHover,
  buttonHover,
  defaultViewport,
} from "../../utils/animations";
import {
  responsiveContainers,
  responsiveSpacing,
  responsiveTypography,
  responsiveComponents,
} from "../../utils/responsive";

export const Section = ({
  children,
  spacing = "large",
  container = "standard",
  className = "",
  ...props
}) => {
  const getSpacingClass = () => {
    switch (spacing) {
      case "small":
        return responsiveSpacing.sectionPaddingSmall;
      case "large":
        return responsiveSpacing.sectionPaddingLarge;
      default:
        return responsiveSpacing.sectionPadding;
    }
  };

  const containerClass =
    responsiveContainers[container] || responsiveContainers.standard;

  return (
    <section className={`${getSpacingClass()} ${className}`} {...props}>
      <div className={containerClass}>{children}</div>
    </section>
  );
};

export const AnimatedSection = ({ children, delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay,
      },
    },
  };

  return (
    <motion.div
      variants={animationVariant}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <Section {...props}>{children}</Section>
    </motion.div>
  );
};

export const Card = ({
  children,
  hover = true,
  padding = "default",
  className = "",
  ...props
}) => {
  const baseClasses = "apple-card";
  const getPaddingClass = () => {
    switch (padding) {
      case "small":
        return responsiveComponents.cardPaddingSmall;
      case "large":
        return responsiveComponents.cardPaddingLarge;
      default:
        return responsiveComponents.cardPadding;
    }
  };
  const hoverClasses = hover ? "apple-card-interactive" : "";

  return (
    <div
      className={`${baseClasses} ${getPaddingClass()} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AnimatedCard = ({
  children,
  delay = 0,
  hover = true,
  ...props
}) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay,
      },
    },
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
        animate: "rest",
      })}
    >
      <Card hover={hover} {...props}>
        {children}
      </Card>
    </motion.div>
  );
};

export const Button = ({
  variant = "primary",
  children,
  className = "",
  animated = true,
  ...props
}) => {
  const variantClasses =
    componentStyles.button[variant] || componentStyles.button.primary;

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

export const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`${componentStyles.input.base} ${className}`}
      {...props}
    />
  );
};

export const Textarea = ({ className = "", ...props }) => {
  return (
    <textarea
      className={`${componentStyles.input.base} ${className}`}
      {...props}
    />
  );
};

export const SectionTitle = ({
  title,
  subtitle,
  centered = true,
  className = "",
}) => {
  const alignmentClass = centered ? "text-center" : "";

  return (
    <div
      className={`${responsiveSpacing.marginBottomLarge} ${alignmentClass} ${className}`}
    >
      <h2
        className={`${responsiveTypography.sectionTitle} tracking-[-0.025em] text-[var(--apple-text-primary)] mb-4`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`${responsiveTypography.sectionSubtitle} text-[var(--apple-text-secondary)] max-w-3xl mx-auto`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const AnimatedSectionTitle = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay,
      },
    },
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

export const Grid = ({
  cols = 3,
  children,
  className = "",
  responsive = true,
}) => {
  const getGridClasses = () => {
    if (!responsive) {
      return `grid grid-cols-${cols}`;
    }

    switch (cols) {
      case 2:
        return "grid grid-cols-1 lg:grid-cols-2";
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className={`${getGridClasses()} ${responsiveSpacing.gap} ${className}`}>
      {children}
    </div>
  );
};

export const StatCard = ({ number, label, suffix = "", className = "" }) => {
  return (
    <div className={`apple-card p-6 text-center ${className}`}>
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--apple-blue)] mb-1.5">
        {number}
        {suffix}
      </div>
      <div className="text-[13px] font-medium text-[var(--apple-text-secondary)]">
        {label}
      </div>
    </div>
  );
};

export const AnimatedStatCard = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...scaleIn,
    visible: {
      ...scaleIn.visible,
      transition: {
        ...scaleIn.visible.transition,
        delay,
      },
    },
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

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  features = [],
  className = "",
}) => {
  return (
    <Card className={className}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#6B63F2] to-[#4e45e1] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-4px_rgba(78,69,225,0.4)] flex items-center justify-center mx-auto mb-6">
          <Icon className="w-7 h-7 text-white badge-white" />
        </div>
        <h3
          className={`${responsiveTypography.cardTitle} text-[var(--apple-text-primary)] mb-3`}
        >
          {title}
        </h3>
        <p
          className={`${responsiveTypography.bodyBase} text-[var(--apple-text-secondary)] mb-6`}
        >
          {description}
        </p>
        {features.length > 0 && (
          <ul className="text-left space-y-2">
            {features.map((feature, index) => (
              <li
                key={index}
                className={`flex items-center ${responsiveTypography.bodySmall} text-[var(--apple-text-secondary)]`}
              >
                <div className="w-1.5 h-1.5 bg-[var(--apple-blue)] rounded-full mr-3 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export const AnimatedFeatureCard = ({ delay = 0, ...props }) => {
  const animationVariant = {
    ...fadeInUp,
    visible: {
      ...fadeInUp.visible,
      transition: {
        ...fadeInUp.visible.transition,
        delay,
      },
    },
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
