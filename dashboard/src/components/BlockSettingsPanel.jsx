import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2,
    X,
    ChevronRight,
    Palette,
    Maximize,
    Layout,
    Layers
} from 'lucide-react';

export default function BlockSettingsPanel({ activeBlock }) {
    return (
        <AnimatePresence>
            {activeBlock && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="w-80 bg-white dark:bg-surface-950 border-l border-surface-200 dark:border-surface-800 shadow-premium p-6 flex flex-col gap-8 h-full sticky top-0"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 uppercase tracking-widest flex items-center gap-2">
                            <Settings2 size={16} className="text-brand-500" />
                            Settings
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-500/10 text-brand-600 rounded-full uppercase tracking-tighter">
                            {activeBlock.type}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <SettingGroup title="Appearance" icon={Palette}>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block">Text Color</label>
                                <div className="flex gap-2">
                                    {['#000000', '#6366f1', '#10b981', '#f59e0b'].map(c => (
                                        <button key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </SettingGroup>

                        <SettingGroup title="Layout" icon={Layout}>
                            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
                                <button className="flex-1 py-2 text-[10px] font-bold bg-white dark:bg-surface-700 shadow-soft rounded-md uppercase tracking-wider">Fixed</button>
                                <button className="flex-1 py-2 text-[10px] font-bold text-surface-500 uppercase tracking-wider">Fluid</button>
                            </div>
                        </SettingGroup>

                        <SettingGroup title="Spacing" icon={Maximize}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Padding</label>
                                    <input type="number" defaultValue={16} className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-lg text-xs font-mono p-2" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Margin</label>
                                    <input type="number" defaultValue={0} className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-lg text-xs font-mono p-2" />
                                </div>
                            </div>
                        </SettingGroup>
                    </div>

                    <div className="mt-auto pt-8">
                        <button className="w-full py-3 bg-red-500/10 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            Delete Block
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SettingGroup({ title, icon: Icon, children }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-surface-900 dark:text-surface-100">
                <Icon size={14} className="text-surface-400" />
                <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}
