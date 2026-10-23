import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  Flame, 
  Zap, 
  Warehouse, 
  ShieldAlert, 
  Coffee, 
  HeartHandshake, 
  Camera, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ChecklistItem, ItemCategory } from '../types.js';

interface ChecklistCardProps {
  item: ChecklistItem;
  onToggle: (item: ChecklistItem) => void;
  onOpenPhotoProof: (item: ChecklistItem) => void;
  onDeleteItem?: (itemId: string) => void;
}

function getCategoryIcon(category: ItemCategory, title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('stove') || lower.includes('oven')) {
    return <Flame className="w-5 h-5 text-amber-600" />;
  }
  if (lower.includes('iron') || lower.includes('curl')) {
    return <Zap className="w-5 h-5 text-rose-500" />;
  }
  if (lower.includes('garage')) {
    return <Warehouse className="w-5 h-5 text-stone-700" />;
  }
  if (lower.includes('coffee') || lower.includes('kettle')) {
    return <Coffee className="w-5 h-5 text-stone-700" />;
  }
  if (category === 'pet' || lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) {
    return <HeartHandshake className="w-5 h-5 text-emerald-600" />;
  }
  if (category === 'security' || lower.includes('window')) {
    return <ShieldAlert className="w-5 h-5 text-blue-600" />;
  }
  return <Lock className="w-5 h-5 text-stone-700" />;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 45) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  item,
  onToggle,
  onOpenPhotoProof,
  onDeleteItem,
}) => {
  const [justChecked, setJustChecked] = useState(false);

  // Trigger a subtle spring bounce when an item becomes checked
  useEffect(() => {
    if (item.checked) {
      setJustChecked(true);
      const timer = setTimeout(() => setJustChecked(false), 600);
      return () => clearTimeout(timer);
    } else {
      setJustChecked(false);
    }
  }, [item.checked]);

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        scale: justChecked ? 1.015 : 1,
        y: justChecked ? -2 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 20,
        mass: 0.8,
      }}
      className={`group relative rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 ${
        item.checked
          ? justChecked
            ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-stone-50/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
          : item.isCritical
          ? 'bg-white dark:bg-stone-900 border-amber-200 dark:border-amber-900/60 shadow-xs ring-1 ring-amber-100 dark:ring-amber-900/30'
          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs'
      }`}
    >
      {/* Left zone: Icon + Details */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <motion.div
          animate={{
            scale: justChecked ? 1.15 : 1,
            rotate: justChecked ? 6 : 0,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
            item.checked
              ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
          }`}
        >
          {getCategoryIcon(item.category, item.title)}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-base font-semibold leading-tight transition-colors ${
                item.checked
                  ? 'text-stone-700 dark:text-stone-400 line-through decoration-stone-400 dark:decoration-stone-600'
                  : 'text-stone-900 dark:text-stone-100'
              }`}
            >
              {item.title}
            </h3>

            {item.isCritical && !item.checked && (
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                High Priority
              </span>
            )}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
            {item.description}
          </p>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-2 font-mono tabular-nums">
            {item.checked ? (
              <>
                <span className="text-emerald-700 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Locked & Checked
                </span>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span>{item.checkedBy || 'Household member'}</span>
                {item.checkedAt && (
                  <>
                    <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                    <span>{formatRelativeTime(item.checkedAt)}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-stone-400 dark:text-stone-500 font-sans">
                Unchecked · Tap to confirm before leaving
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right zone: Photo proof indicator + Big Touch Button */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
        {/* Photo Proof trigger button */}
        <button
          onClick={() => onOpenPhotoProof(item)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] ${
            item.photoProofUrl
              ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title={item.photoProofUrl ? 'View verified photo proof' : 'Snap reassurance photo'}
        >
          <Camera className="w-4 h-4" />
          <span className="hidden xs:inline">
            {item.photoProofUrl ? 'Photo Verified' : 'Photo Proof'}
          </span>
        </button>

        {onDeleteItem && (
          <button
            onClick={() => onDeleteItem(item.id)}
            className="p-2 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Remove item"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Primary Tactile Lock/Check Button with spring response */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          animate={{
            scale: justChecked ? 1.05 : 1,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 18 }}
          onClick={() => onToggle(item)}
          aria-pressed={item.checked}
          className={`min-h-[48px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer select-none ${
            item.checked
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300/80 dark:border-stone-700'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {item.checked ? (
              <motion.div
                key="locked"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Locked</span>
              </motion.div>
            ) : (
              <motion.div
                key="unlocked"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex items-center gap-2"
              >
                <Unlock className="w-4 h-4 text-stone-500" />
                <span>Check & Lock</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};
