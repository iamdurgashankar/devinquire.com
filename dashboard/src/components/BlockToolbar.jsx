import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bold,
    Italic,
    Link,
    List,
    ListOrdered,
    Quote,
    Code as CodeIcon,
    AlignLeft,
    AlignCenter,
    AlignRight
} from 'lucide-react';

export default function BlockToolbar({ block }) {
    if (!block || block.type !== 'text') return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="flex items-center gap-1 p-1.5 bg-surface-900 rounded-xl shadow-premium border border-surface-700/50 backdrop-blur-xl"
        >
            <ToolbarButton icon={Bold} />
            <ToolbarButton icon={Italic} />
            <ToolbarButton icon={Link} />
            <div className="w-[1px] h-4 bg-surface-700 mx-1" />
            <ToolbarButton icon={List} />
            <ToolbarButton icon={ListOrdered} />
            <ToolbarButton icon={Quote} />
            <div className="w-[1px] h-4 bg-surface-700 mx-1" />
            <ToolbarButton icon={AlignLeft} />
            <ToolbarButton icon={AlignCenter} />
            <ToolbarButton icon={AlignRight} />
        </motion.div>
    );
}

function ToolbarButton({ icon: Icon, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-all ${active
                    ? 'bg-brand-500 text-white'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800'
                }`}
        >
            <Icon size={16} />
        </button>
    );
}
