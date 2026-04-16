import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, Globe, Code, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModernCTA = ({
  title = "Ready to Start Your Project?",
  subtitle = "Let's discuss how we can help bring your vision to life with cutting-edge technology and exceptional design.",
  primaryText = "Get Started Today",
  primaryLink = "/contact",
  secondaryText = "Learn More",
  secondaryLink = "/services"
}) => {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] bg-[#4e45e1] shadow-2xl"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid Pattern */}
          <div 
            className="absolute top-0 right-0 w-1/2 h-full opacity-10" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          
          {/* Floating Icons */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 text-white/20"
          >
            <Code size={40} strokeWidth={1.5} />
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-12 text-white/20"
          >
            <Zap size={32} strokeWidth={1.5} />
          </motion.div>
          
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-10 right-10 text-white/10"
          >
            <Rocket size={64} strokeWidth={1} />
          </motion.div>
          
          {/* Glow effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 flex flex-col items-center text-center">
          {/* Glass Icon Box */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
          >
            <Rocket className="text-white w-8 h-8 md:w-10 md:h-10" />
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight max-w-4xl">
            {title}
          </h2>
          
          <p className="text-lg md:text-xl text-blue-100/80 mb-12 max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
            <Link 
              to={primaryLink}
              className="group bg-white text-[#4e45e1] px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
            >
              {primaryText}
              <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            
            <Link 
              to={secondaryLink}
              className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300 hover:border-white flex items-center justify-center gap-2"
            >
              {secondaryText}
              <Globe className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernCTA;
