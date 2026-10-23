import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Camera,
  RotateCcw
} from 'lucide-react';
import type { ChecklistItem } from '../types.js';
import { sound } from '../utils/audio.js';

interface QuickOutingModeProps {
  items: ChecklistItem[];
  currentMemberName: string;
  onToggleItem: (item: ChecklistItem) => void;
  onOpenPhotoProof: (item: ChecklistItem) => void;
  onClose: () => void;
  onResetAll: () => void;
}

export const QuickOutingMode: React.FC<QuickOutingModeProps> = ({
  items,
  currentMemberName,
  onToggleItem,
  onOpenPhotoProof,
  onClose,
  onResetAll,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const uncheckedItems = items.filter((i) => !i.checked);
  const isAllComplete = items.length > 0 && uncheckedItems.length === 0;

  const currentItem = items[currentIndex] || items[0];

  const handleTapCurrent = () => {
    if (!currentItem) return;
    const wasChecked = currentItem.checked;
    onToggleItem(currentItem);

    if (!wasChecked) {
      sound.playLockSound();
      // If there are more unchecked items, advance to next unchecked
      const nextUncheckedIdx = items.findIndex((i, idx) => idx > currentIndex && !i.checked);
      if (nextUncheckedIdx !== -1) {
        setCurrentIndex(nextUncheckedIdx);
      } else if (items.filter((i) => !i.checked).length <= 1) {
        sound.playAllClearFanfare();
      }
    } else {
      sound.playUnlockSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Departure Rapid Tap-Through
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Exit rapid mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{
              width: `${items.length > 0 ? ((items.length - uncheckedItems.length) / items.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 text-center flex-1 flex flex-col justify-center">
          {isAllComplete ? (
            <div className="space-y-5 py-4 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  All Clear — Safe to Leave!
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 max-w-xs mx-auto">
                  Every door, stove, iron, and garage is verified and locked. Have a peaceful trip!
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2.5 max-w-xs mx-auto">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Done & Exit Mode
                </button>
                <button
                  onClick={onResetAll}
                  className="w-full py-2.5 px-4 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Checklist for Next Outing</span>
                </button>
              </div>
            </div>
          ) : currentItem ? (
            <div className="space-y-6">
              {/* Counter Indicator */}
              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">
                Item {currentIndex + 1} of {items.length} · {items.length - uncheckedItems.length} Secured
              </div>

              {/* Current Item Title & Instructions */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  {currentItem.title}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                  {currentItem.description}
                </p>
              </div>

              {/* Huge Tactile Tap Button */}
              <div className="py-2">
                <button
                  onClick={handleTapCurrent}
                  className={`w-full max-w-xs mx-auto py-6 px-8 rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-lg cursor-pointer ${
                    currentItem.checked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white shadow-stone-900/20 ring-4 ring-stone-900/10 dark:ring-stone-700/30'
                  }`}
                >
                  {currentItem.checked ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-white" />
                      <span>SECURED & LOCKED</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-8 h-8 text-emerald-400" />
                      <span>TAP TO LOCK</span>
                    </>
                  )}
                  <span className="text-[11px] font-normal opacity-80">
                    {currentItem.checked ? 'Tap again to unlock' : 'Click to confirm safety'}
                  </span>
                </button>
              </div>

              {/* Photo proof quick link */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => onOpenPhotoProof(currentItem)}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {currentItem.photoProofUrl ? 'Photo proof attached' : 'Snap photo proof'}
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Carousel Footer Navigation */}
        {!isAllComplete && (
          <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/60">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 disabled:hover:text-stone-600 dark:disabled:hover:text-stone-400 flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5">
              {items.map((it, idx) => (
                <button
                  key={it.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-stone-900 dark:bg-stone-100'
                      : it.checked
                      ? 'bg-emerald-500'
                      : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                  title={it.title}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
              disabled={currentIndex === items.length - 1}
              className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 disabled:hover:text-stone-600 dark:disabled:hover:text-stone-400 flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
