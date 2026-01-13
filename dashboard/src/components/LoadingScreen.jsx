import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary/5 to-accent/10 flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] bg-gradient-to-br from-[var(--primary)]/20 via-[var(--secondary)]/15 to-[var(--accent)]/10 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-gradient-to-tr from-[var(--primary)]/20 via-[var(--secondary)]/15 to-[var(--accent)]/10 rounded-full blur-3xl opacity-50 animate-pulse" />
      
      <div className="text-center z-10">
        {/* Logo */}
        <motion.div 
          className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)] rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-8 relative overflow-hidden"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-center justify-center text-white font-bold text-lg">
            <span className="text-white/80 mr-1 text-sm">&#123;</span>
            <span className="text-white font-bold">DI</span>
            <span className="text-white/80 ml-1 text-sm">&#125;</span>
          </div>
        </motion.div>
        
        {/* Loading text */}
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          DevInquire
        </motion.h1>
        
        <motion.p 
          className="text-neutral-600 mb-8 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {message}
        </motion.p>
        
        {/* Loading spinner */}
        <motion.div 
          className="w-12 h-12 border-4 border-neutral-200 border-t-[var(--primary)] rounded-full mx-auto"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;