import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone app, do not show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Install Prompt
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-900 dark:to-stone-950 text-white border border-stone-700/60 shadow-lg flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Install Did I Lock It? to Home Screen</p>
              <p className="text-[11px] text-stone-300">Fast 1-tap departure checklist & geofence notifications</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm min-h-[40px] ${className}`}
        title="Install to your phone home screen"
        aria-label="Install App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (since beforeinstallprompt is not fired by iOS WebKit)
  return (
    <>
      {variant === 'banner' ? (
        <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-900 dark:to-stone-950 text-white border border-stone-700/60 shadow-lg flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Add to Phone Home Screen</p>
              <p className="text-[11px] text-stone-300">Run as a full-screen mobile app with instant lock widget</p>
            </div>
          </div>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-white text-stone-900 rounded-xl text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm min-h-[44px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Add to Phone</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer min-h-[40px] ${className}`}
          title="Add to Home Screen on your iPhone / iPad"
          aria-label="Install on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
          <span>Add to Phone</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">Tap the Share icon</p>
                  <p className="text-stone-500 dark:text-stone-400">At the bottom of your Safari screen (the square with an arrow pointing up).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">Tap "Add to Home Screen"</p>
                  <p className="text-stone-500 dark:text-stone-400">Scroll down the menu list and tap <span className="font-medium">Add to Home Screen</span>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">Tap "Add" in top-right</p>
                  <p className="text-stone-500 dark:text-stone-400">Did I Lock It? will appear right on your home screen with a dedicated app icon.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
