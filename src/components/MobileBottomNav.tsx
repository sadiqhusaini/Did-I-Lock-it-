import React from 'react';
import { CheckSquare, Zap, MapPin, Users, Plus } from 'lucide-react';
import { triggerHaptic } from '../utils/audio.js';

interface MobileBottomNavProps {
  activeTab: 'checklist' | 'sync' | 'geofence' | 'activity';
  onSelectTab: (tab: 'checklist' | 'sync' | 'geofence' | 'activity') => void;
  onOpenQuickOuting: () => void;
  onOpenAddItem: () => void;
  uncheckedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickOuting,
  onOpenAddItem,
  uncheckedCount,
}) => {
  return (
    <nav
      aria-label="Mobile thumb navigation"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-3"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Checklist Tab */}
        <button
          onClick={() => {
            triggerHaptic(10);
            onSelectTab('checklist');
          }}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'text-stone-900 dark:text-stone-100 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {uncheckedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {uncheckedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none">Checks</span>
        </button>

        {/* Departure Geofence Tab */}
        <button
          onClick={() => {
            triggerHaptic(10);
            onSelectTab('geofence');
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'geofence'
              ? 'text-stone-900 dark:text-stone-100 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Radar</span>
        </button>

        {/* Central Prominent Quick Outing "Rapid Tap" Button */}
        <button
          onClick={() => {
            triggerHaptic([20, 40]);
            onOpenQuickOuting();
          }}
          className="relative -top-3 flex flex-col items-center justify-center min-w-[58px] min-h-[58px] rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xl ring-4 ring-white dark:ring-stone-900 active:scale-95 transition-all cursor-pointer"
          title="Rapid Departure Tap-Through"
          aria-label="Rapid Departure Mode"
        >
          <Zap className="w-6 h-6 text-emerald-400 dark:text-emerald-600 fill-emerald-400 dark:fill-emerald-600" />
          <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5">Rapid</span>
        </button>

        {/* Household Sync Tab */}
        <button
          onClick={() => {
            triggerHaptic(10);
            onSelectTab('sync');
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'sync'
              ? 'text-stone-900 dark:text-stone-100 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Family</span>
        </button>

        {/* Quick Add Item */}
        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenAddItem();
          }}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-all cursor-pointer"
          title="Add New Checklist Item"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Add</span>
        </button>
      </div>
    </nav>
  );
};
