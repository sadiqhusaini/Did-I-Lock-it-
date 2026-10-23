import React, { useEffect, useState } from 'react';
import { AlertTriangle, Volume2, VolumeX, ArrowLeft, CheckCheck, Clock, Users } from 'lucide-react';
import { sound } from '../utils/audio.js';

interface NagAlertModalProps {
  isOpen: boolean;
  uncheckedItems: string[];
  distanceMeters: number;
  triggeredBy: string;
  onDismiss: () => void;
  onRemoteCheckAll: () => void;
  onSnooze: (minutes: number) => void;
  onNudgeHousehold: () => void;
}

export const NagAlertModal: React.FC<NagAlertModalProps> = ({
  isOpen,
  uncheckedItems,
  distanceMeters,
  triggeredBy,
  onDismiss,
  onRemoteCheckAll,
  onSnooze,
  onNudgeHousehold,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    if (isOpen && !isAudioMuted) {
      sound.startNaggingLoop(4000);
    } else {
      sound.stopNaggingLoop();
    }
    return () => {
      sound.stopNaggingLoop();
    };
  }, [isOpen, isAudioMuted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full border border-rose-300 dark:border-rose-900/60 shadow-2xl overflow-hidden ring-4 ring-rose-500/20">
        {/* Header alert strip */}
        <div className="bg-rose-600 dark:bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Nagging Departure Alert!
              </h2>
              <p className="text-xs text-rose-100 font-mono">
                {triggeredBy} left home ({Math.round(distanceMeters)}m away) with open items!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white cursor-pointer"
            title={isAudioMuted ? 'Unmute nag alarm' : 'Mute nag alarm'}
            aria-label={isAudioMuted ? 'Unmute nag alarm' : 'Mute nag alarm'}
          >
            {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-bounce" />}
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300 font-medium">
            You walked out without completing your safety checklist. The following {uncheckedItems.length} {uncheckedItems.length === 1 ? 'item is' : 'items are'} still unchecked:
          </p>

          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 space-y-2 max-h-48 overflow-y-auto">
            {uncheckedItems.map((itemTitle, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-rose-900 dark:text-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{itemTitle}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Did you lock up and just forget to tap the widget? Or do you need to turn back and double-check?
          </p>

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={onDismiss}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>I'm Heading Back</span>
            </button>

            <button
              onClick={onRemoteCheckAll}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Safe Remotely</span>
            </button>

            <button
              onClick={() => onSnooze(5)}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze Nag (5 min)</span>
            </button>

            <button
              onClick={onNudgeHousehold}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nudge Family at Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
