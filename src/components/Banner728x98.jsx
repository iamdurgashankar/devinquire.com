import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

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
      className={`relative bg-gradient-to-r from-[#0077b6] via-[#0088cc] to-[#0077b6] overflow-hidden ${className}`}
      style={{
        minHeight: '98px',
        maxWidth: '728px',
        margin: '0 auto'
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center justify-between px-6 py-4">
        {/* Left Content */}
        <div className="flex-1 pr-4">
          <div className="flex items-center mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300 mr-2 animate-pulse" />
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-blue-100 leading-tight max-w-md">
            {subtitle}
          </p>
        </div>

        {/* Right CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link 
            to={primaryButtonLink}
            className="group bg-white text-[#0077b6] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <span>{primaryButtonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link 
            to={secondaryButtonLink}
            className="border-2 border-white text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-[#0077b6] transition-all duration-300 transform hover:scale-105 hidden sm:block"
          >
            {secondaryButtonText}
          </Link>
        </div>
      </div>

      {/* Responsive Adjustments */}
      <style jsx>{`
        @media (max-width: 640px) {
          .banner-content {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }
        }
        
        @media (max-width: 480px) {
          .banner-title {
            font-size: 1rem;
          }
          .banner-subtitle {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </motion.section>
  );
};

export default Banner728x98;