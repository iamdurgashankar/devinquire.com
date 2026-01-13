import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Shield,
  Crown,
  Activity
} from 'lucide-react';

const Sidebar = ({
  isOpen,
  setIsOpen,
  navigationItems,
  onLogout,
  currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const sidebarVariants = {
    open: {
      width: '18rem',
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: {
      width: '5rem',
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className={`
        h-screen z-50 overflow-hidden
        bg-white/[0.02] backdrop-blur-xl text-white/70
        border-r border-white/5 shadow-2xl
        transition-all hidden lg:flex flex-col flex-shrink-0 relative
      `}
    >
      {/* Subtle Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand-600/10 to-transparent pointer-events-none" />

      {/* Header / Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 relative z-10">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="logo-open"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                <Shield size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base text-white tracking-tight">
                  DevInquire
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    Operational
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 mx-auto transition-all hover:scale-105 active:scale-95"
            >
              <Shield size={20} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-all absolute -right-3 top-7 z-20 bg-neutral-800 border border-white/10 shadow-xl"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.onClick ? item.onClick() : null}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
              ${item.isActive
                ? 'bg-indigo-600/10 text-indigo-500'
                : 'text-white/50 hover:bg-white/5 hover:text-white'}
            `}
          >
            <div className={`
              transition-all duration-200
              ${item.isActive ? 'text-indigo-500' : 'text-current'}
            `}>
              <item.icon size={18} />
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap font-medium text-sm tracking-tight flex-1 text-left"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>

            {item.isActive && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute right-0 w-1 h-5 bg-indigo-500 rounded-l-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              />
            )}

            {!isOpen && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-neutral-800 text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl border border-white/10">
                {item.name}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
            text-white/40 hover:text-red-400 hover:bg-red-400/10
            ${!isOpen && 'justify-center'}
          `}
        >
          <LogOut size={18} />
          {isOpen && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
