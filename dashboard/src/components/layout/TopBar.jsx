import React from 'react';
import {
  Bell,
  Search,
  User,
  Plus,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

const TopBar = ({
  user,
  onSearch,
  onNotificationClick,
  onProfileClick
}) => {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-white/5 transition-all duration-200">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Left: Tactical Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <Search className="text-neutral-400 group-focus-within:text-brand-500 transition-colors w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search or run command..."
              className="w-full pl-11 pr-16 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 outline-none"
              onChange={(e) => onSearch?.(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-1.5 py-1 rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-800 text-[10px] font-bold text-neutral-400 pointer-events-none">
              <span className="opacity-70">⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right: Operations Cluster */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-95">
              <Plus size={16} />
              <span>Create</span>
            </button>

            <div className="w-[1px] h-6 bg-neutral-200 dark:bg-white/10 mx-1" />

            <div className="flex items-center">
              <button
                onClick={onNotificationClick}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-400 transition-all relative active:scale-95"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-neutral-900" />
              </button>

              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-400 transition-all active:scale-95">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-neutral-200 dark:bg-white/10 mx-1" />

          {/* User Profile */}
          <button
            onClick={onProfileClick}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-neutral-200 dark:hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-300 dark:border-white/10 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight pr-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {user?.displayName || 'Admin'}
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">Administrator</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
