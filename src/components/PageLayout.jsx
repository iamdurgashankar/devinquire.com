import React from 'react';
import { motion } from 'framer-motion';
import { colors, animations } from '../styles/constants';
import { heroTitle, heroSubtitle } from '../utils/animations';
import { responsiveContainers, responsiveSpacing, responsiveTypography } from '../utils/responsive';

const PageLayout = ({ 
  title, 
  subtitle, 
  heroBackground = '#4e45e1',
  children,
  showAnimatedBackground = true 
}) => {
  const titleVariants = heroTitle;
  const subtitleVariants = heroSubtitle;
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section 
        className="text-white py-20 relative overflow-hidden"
        style={{ backgroundColor: heroBackground }}
      >
        {/* Animated background elements */}
        {showAnimatedBackground && (
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
        )}

        <div className={`relative text-center ${responsiveContainers.standard}`}>
          <motion.h1 
            className={`${responsiveTypography.heroTitle} font-bold ${responsiveSpacing.marginBottomMedium} leading-tight`}
            variants={titleVariants}
            initial="hidden"
            animate="visible"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              className={`${responsiveTypography.heroSubtitle} text-blue-100 max-w-3xl mx-auto leading-relaxed`}
              variants={subtitleVariants}
              initial="hidden"
              animate="visible"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;