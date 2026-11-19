import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Banner728x98 = ({ 
  title = "Ready to Work Together?", 
  subtitle = "Let's discuss your project and see how we can help bring your vision to life.",
  primaryButtonText = "Get Started",
  primaryButtonLink = "/contact",
  secondaryButtonText = "View Services",
  secondaryButtonLink = "/services",
  className = ""
}) => {
  return (
    <motion.section 
      className={`relative apple-card overflow-hidden ${className}`}
      style={{
        minHeight: '98px',
        maxWidth: '728px',
        margin: '0 auto'
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient Apple Glow */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#007AFF]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#5E5CE6]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start mb-1">
            <h2 className="text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] leading-snug max-w-md">
            {subtitle}
          </p>
        </div>

        <div className="apple-btn-pair flex items-center gap-2.5 shrink-0">
          <Link 
            to={primaryButtonLink}
            className="apple-pill-btn px-4 py-2 text-[13px]"
          >
            <span>{primaryButtonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          
          <Link 
            to={secondaryButtonLink}
            className="apple-secondary-btn px-4 py-2 text-[13px] hidden sm:inline-flex"
          >
            {secondaryButtonText}
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default Banner728x98;
