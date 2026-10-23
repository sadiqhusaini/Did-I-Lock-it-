import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Plus, 
  Bell, 
  MapPin, 
  Users, 
  Sparkles 
} from 'lucide-react';
import type { HouseholdState, ChecklistItem, ItemCategory } from './types.js';
import { TopNav } from './components/TopNav.js';
import { ChecklistCard } from './components/ChecklistCard.js';
import { DepartureSimulator } from './components/DepartureSimulator.js';
import { HouseholdSyncPanel } from './components/HouseholdSyncPanel.js';
import { NagAlertModal } from './components/NagAlertModal.js';
import { PhotoProofModal } from './components/PhotoProofModal.js';
import { AddItemModal } from './components/AddItemModal.js';
import { QuickOutingMode } from './components/QuickOutingMode.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { sound } from './utils/audio.js';
import { calculateDistanceMeters } from './utils/geo.js';
import { requestNotificationPermission, sendNagNotification } from './utils/notifications.js';

// Fallback initial state if server is loading
const DEFAULT_HOUSEHOLD_ID = 'HOME-4821';

export default function App() {
  const [householdId, setHouseholdId] = useState<string>(() => {
    return localStorage.getItem('did_i_lock_it_house_id') || DEFAULT_HOUSEHOLD_ID;
  });

  const [currentMemberName, setCurrentMemberName] = useState<string>(() => {
    return localStorage.getItem('did_i_lock_it_member_name') || 'Sarah M.';
  });

  const [activeTab, setActiveTab] = useState<'checklist' | 'sync' | 'geofence' | 'activity'>('checklist');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'critical' | 'door' | 'appliance'>('all');
  
  const [household, setHousehold] = useState<HouseholdState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connection & Sync state
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Global dark mode persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('did_i_lock_it_theme');
      if (saved) return saved === 'dark';
      return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('did_i_lock_it_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('did_i_lock_it_theme', 'light');
      }
    } catch (e) {
      console.warn('Error saving theme preference:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Departure & Geofence tracking state
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [isRealGpsActive, setIsRealGpsActive] = useState(false);
  const [hasPromptedNotification, setHasPromptedNotification] = useState(false);

  // Modals state
  const [photoProofItem, setPhotoProofItem] = useState<ChecklistItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isQuickOutingOpen, setIsQuickOutingOpen] = useState(false);
  const [isSwitchMemberModalOpen, setIsSwitchMemberModalOpen] = useState(false);
  const [newMemberInputName, setNewMemberInputName] = useState('');

  const walkSimulationIntervalRef = useRef<number | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Fetch household state from server
  const fetchHousehold = async (id: string) => {
    try {
      const res = await fetch(`/api/household/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data: HouseholdState = await res.json();
        setHousehold(data);
        setSyncStatus('connected');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('reconnecting');
      }
    } catch (err) {
      console.warn('Error fetching household:', err);
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Server-Sent Events (SSE) for instant real-time sync across household devices
  useEffect(() => {
    setIsLoading(true);
    fetchHousehold(householdId);

    // Save active household
    localStorage.setItem('did_i_lock_it_house_id', householdId);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/household/${encodeURIComponent(householdId)}/stream`);
      
      eventSource.onopen = () => {
        setSyncStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const updated: HouseholdState = JSON.parse(event.data);
          setHousehold(updated);
          setSyncStatus('connected');
          setLastSyncTime(new Date());

          // If a new nag alert was broadcast to the household
          if (updated.activeNagAlert) {
            sendNagNotification(
              '🚨 Did I Lock It? Departure Alert!',
              `${updated.activeNagAlert.triggeredByMember} left home with ${updated.activeNagAlert.uncheckedCount} unchecked items!`,
              updated.activeNagAlert.uncheckedItems
            );
          }

          // If a new nudge alert was sent by another household member
          if (updated.activeNudgeAlert && updated.activeNudgeAlert.fromMember !== currentMemberName) {
            sound.playUnlockSound();
            sendNagNotification(
              `💬 Household Nudge from ${updated.activeNudgeAlert.fromMember}`,
              updated.activeNudgeAlert.message
            );
          }
        } catch (e) {
          console.warn('Error parsing SSE payload:', e);
        }
      };

      eventSource.onerror = () => {
        setSyncStatus('reconnecting');
      };
    } catch {
      setSyncStatus('offline');
    }

    // Polling backup every 4s to catch any dropped networks
    const pollInterval = setInterval(() => {
      fetchHousehold(householdId);
    }, 4000);

    // Instant re-sync when window or tab regains focus (e.g. phone unlocked)
    const handleFocus = () => {
      fetchHousehold(householdId);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [householdId, currentMemberName]);

  // Handle Real GPS Tracking
  const toggleRealGps = () => {
    if (isRealGpsActive) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      setIsRealGpsActive(false);
    } else {
      if (!('geolocation' in navigator)) {
        console.warn('Geolocation is not supported in this browser.');
        return;
      }
      setIsRealGpsActive(true);
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!household) return;
          const dist = calculateDistanceMeters(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            { latitude: household.geofence.homeLatitude, longitude: household.geofence.homeLongitude }
          );
          handleUpdateDistance(dist);
        },
        (err) => {
          console.warn('GPS watch error:', err);
          setIsRealGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }
  };

  // Update distance from home & check geofence boundary
  const handleUpdateDistance = async (dist: number) => {
    setCurrentDistance(dist);
    if (!household) return;

    const radius = household.geofence.radiusMeters;
    const status = dist > radius ? 'away' : dist > radius * 0.4 ? 'departing' : 'at_home';

    try {
      const res = await fetch(`/api/household/${household.id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: currentMemberName,
          distanceFromHomeMeters: dist,
          status,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.nagFired) {
          sound.playNagChirp();
          sendNagNotification(
            '🚨 Nagging Alert: You Left Home with Open Checks!',
            `You are ${Math.round(dist)}m away from home, but items are still unlocked!`,
            result.activeNagAlert?.uncheckedItems
          );
        }
      }
    } catch (err) {
      console.warn('Error reporting location:', err);
    }
  };

  // Simulate Leaving Home Walk (0m -> 40m -> 85m -> 140m)
  const handleTriggerSimulatedDeparture = () => {
    if (walkSimulationIntervalRef.current !== null) {
      clearInterval(walkSimulationIntervalRef.current);
    }

    setIsSimulatingWalk(true);
    let simDist = 0;
    setCurrentDistance(0);

    walkSimulationIntervalRef.current = window.setInterval(() => {
      simDist += 20;
      handleUpdateDistance(simDist);

      const radius = household?.geofence.radiusMeters || 75;
      if (simDist >= radius + 25) {
        // Breached geofence! Stop simulation and let nag alert fire
        if (walkSimulationIntervalRef.current !== null) {
          clearInterval(walkSimulationIntervalRef.current);
          walkSimulationIntervalRef.current = null;
        }
        setIsSimulatingWalk(false);
      }
    }, 700);
  };

  const handleResetToHome = () => {
    if (walkSimulationIntervalRef.current !== null) {
      clearInterval(walkSimulationIntervalRef.current);
      walkSimulationIntervalRef.current = null;
    }
    setIsSimulatingWalk(false);
    handleUpdateDistance(0);
  };

  // Toggle item check state
  const handleToggleItem = async (item: ChecklistItem) => {
    if (!household) return;
    const nextState = !item.checked;

    if (nextState) {
      sound.playLockSound();
    } else {
      sound.playUnlockSound();
    }

    // Optimistic local update
    setHousehold((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id
            ? {
                ...i,
                checked: nextState,
                checkedBy: nextState ? currentMemberName : undefined,
                checkedAt: nextState ? new Date().toISOString() : undefined,
              }
            : i
        ),
      };
    });

    try {
      const res = await fetch(`/api/household/${household.id}/item/${item.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checked: nextState,
          memberName: currentMemberName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
      }
    } catch (err) {
      console.warn('Error toggling item:', err);
    }
  };

  // Save photo proof
  const handleSavePhotoProof = async (itemId: string, photoDataUrl: string) => {
    if (!household) return;
    try {
      const res = await fetch(`/api/household/${household.id}/item/${itemId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checked: true,
          memberName: currentMemberName,
          photoProofUrl: photoDataUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
        sound.playLockSound();
      }
    } catch (err) {
      console.warn('Error saving photo proof:', err);
    }
  };

  const handleDeletePhotoProof = async (itemId: string) => {
    if (!household) return;
    try {
      const res = await fetch(`/api/household/${household.id}/item/${itemId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoProofUrl: '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
        setPhotoProofItem(null);
      }
    } catch (err) {
      console.warn('Error deleting photo proof:', err);
    }
  };

  // Reset all for a fresh outing
  const handleResetChecklist = async () => {
    if (!household) return;
    sound.playUnlockSound();
    try {
      const res = await fetch(`/api/household/${household.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName: currentMemberName }),
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
      }
    } catch (err) {
      console.warn('Error resetting checklist:', err);
    }
  };

  // Add custom item
  const handleAddItem = async (title: string, category: ItemCategory, description: string, isCritical: boolean) => {
    if (!household) return;
    try {
      const res = await fetch(`/api/household/${household.id}/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          isCritical,
          memberName: currentMemberName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
      }
    } catch (err) {
      console.warn('Error adding item:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!household) return;
    try {
      const res = await fetch(`/api/household/${household.id}/item/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
      }
    } catch (err) {
      console.warn('Error deleting item:', err);
    }
  };

  // Household Member Add/Switch
  const handleAddMember = async (name: string, avatarColor: string) => {
    if (!household) return;
    try {
      const res = await fetch(`/api/household/${household.id}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarColor }),
      });
      if (res.ok) {
        setCurrentMemberName(name);
        localStorage.setItem('did_i_lock_it_member_name', name);
        fetchHousehold(household.id);
      }
    } catch (err) {
      console.warn('Error adding member:', err);
    }
  };

  const handleSwitchMember = (memberId: string) => {
    const member = household?.members.find((m) => m.id === memberId);
    if (member) {
      setCurrentMemberName(member.name);
      localStorage.setItem('did_i_lock_it_member_name', member.name);
    }
  };

  // Nudge Household
  const handleSendNudge = async (message: string) => {
    if (!household) return;
    try {
      await fetch(`/api/household/${household.id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName: currentMemberName, message }),
      });
    } catch (err) {
      console.warn('Error sending nudge:', err);
    }
  };

  const handleDismissNudge = async () => {
    if (!household) return;
    try {
      await fetch(`/api/household/${household.id}/nudge-ack`, { method: 'POST' });
      setHousehold((prev) => (prev ? { ...prev, activeNudgeAlert: null } : prev));
    } catch (err) {
      console.warn('Error acknowledging nudge:', err);
    }
  };

  // Nag alerts dismissal/snooze/remote check
  const handleDismissNag = async () => {
    sound.stopNaggingLoop();
    if (!household) return;
    await fetch(`/api/household/${household.id}/nag-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss', memberName: currentMemberName }),
    });
    fetchHousehold(household.id);
  };

  const handleRemoteCheckAll = async () => {
    sound.stopNaggingLoop();
    sound.playAllClearFanfare();
    if (!household) return;
    await fetch(`/api/household/${household.id}/nag-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remote_check_all', memberName: currentMemberName }),
    });
    fetchHousehold(household.id);
  };

  const handleSnoozeNag = async (minutes: number) => {
    sound.stopNaggingLoop();
    if (!household) return;
    await fetch(`/api/household/${household.id}/nag-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'snooze', snoozeMinutes: minutes, memberName: currentMemberName }),
    });
    fetchHousehold(household.id);
  };

  // Geofence settings update
  const handleUpdateGeofence = async (newSettings: Partial<HouseholdState['geofence']>) => {
    if (!household) return;
    try {
      await fetch(`/api/household/${household.id}/geofence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      fetchHousehold(household.id);
    } catch (err) {
      console.warn('Error updating geofence:', err);
    }
  };

  // Notification permission prompt
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setHasPromptedNotification(true);
    if (perm === 'granted') {
      sendNagNotification('Did I Lock It?', 'Departure safety alerts are now active for this household.');
    }
  };

  // Filter items
  const items = household?.items || [];
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const percentComplete = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const isAllComplete = totalItems > 0 && checkedItems === totalItems;

  const filteredItems = items.filter((item) => {
    if (categoryFilter === 'critical') return item.isCritical;
    if (categoryFilter === 'door') return item.category === 'door';
    if (categoryFilter === 'appliance') return item.category === 'appliance';
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200 selection:bg-stone-900 selection:text-white dark:selection:bg-stone-100 dark:selection:text-stone-900">
      {/* Top Bar adheres to Top Bar Contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        householdName={household?.name || 'My Household'}
        householdCode={household?.code || householdId}
        currentMemberName={currentMemberName}
        totalItems={totalItems}
        checkedItems={checkedItems}
        syncStatus={syncStatus}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onQuickDeparture={() => setIsQuickOutingOpen(true)}
        onOpenSwitchMember={() => setIsSwitchMemberModalOpen(true)}
        onManualSync={() => fetchHousehold(householdId)}
      />

      {/* Main Content Layout with safe bottom padding for mobile bottom nav */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 pb-28 sm:pb-8">
        {/* Active Household Nudge Banner */}
        {household?.activeNudgeAlert && (
          <div className="bg-stone-900 dark:bg-stone-900 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-stone-300 font-mono">
                  Household Nudge from <strong>{household.activeNudgeAlert.fromMember}</strong>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  "{household.activeNudgeAlert.message}"
                </div>
              </div>
            </div>
            <button
              onClick={handleDismissNudge}
              className="px-3.5 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
            >
              Got it / Done
            </button>
          </div>
        )}

        {/* Tab-driven layout or split desktop layout */}
        {activeTab === 'checklist' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Hero Banner with reassurance visual */}
            <div className="relative rounded-3xl overflow-hidden border border-stone-200/90 dark:border-stone-800 bg-stone-900 text-white shadow-sm min-h-[200px] sm:min-h-[220px] flex flex-col justify-end">
              <img
                src="/src/assets/images/house_departure_hero_1792722717756.jpg"
                alt="Warm entryway with front door and keys"
                className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />

              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
                    <span>{household?.name || 'Maplewood Residence'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Code {household?.code || householdId}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-sans font-medium">
                      Live Sync
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
                    {isAllComplete
                      ? 'All Locked & Secured — Safe to Leave!'
                      : 'Check Doors, Stove, Iron & Garage'}
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-300 line-clamp-2">
                    Tap through before stepping out. If you depart past your {household?.geofence.radiusMeters || 75}m home geofence with items unlatched, you'll get a persistent nagging alert.
                  </p>
                </div>

                {/* Progress gauge card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 flex items-center gap-5">
                  <div>
                    <div className="text-[11px] text-stone-300 font-medium">Secured Status</div>
                    <div className="text-2xl font-black font-mono tabular-nums text-white mt-0.5">
                      {checkedItems}/{totalItems} <span className="text-xs font-normal text-stone-300">({percentComplete}%)</span>
                    </div>
                    <div className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isAllComplete ? 'Ready for departure' : `${totalItems - checkedItems} remaining`}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsQuickOutingOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white text-stone-950 text-xs font-bold hover:bg-stone-100 transition-transform active:scale-95 shadow-sm cursor-pointer"
                  >
                    Tap on Way Out
                  </button>
                </div>
              </div>
            </div>

            {/* Browser Notification Permission Banner (if not yet granted) */}
            {!hasPromptedNotification && 'Notification' in window && Notification.permission !== 'granted' && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Enable Nagging Push Notifications:</strong> Get alerted the moment you drive or walk away from home if a door or stove is left unchecked.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleEnableNotifications}
                    className="px-3.5 py-2 rounded-lg bg-amber-900 dark:bg-amber-700 text-white font-medium text-xs hover:bg-amber-800 dark:hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    Enable Notifications
                  </button>
                  <button
                    onClick={() => setHasPromptedNotification(true)}
                    className="px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: The Primary Checklist Widget */}
            <div className="lg:col-span-8 space-y-4">
              {/* Filter Tabs & Action Bar */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                {/* Segmented Filter Tab Controls */}
                <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === 'all'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('critical')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === 'critical'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    Critical Only
                  </button>
                  <button
                    onClick={() => setCategoryFilter('door')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === 'door'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    Doors & Garage
                  </button>
                  <button
                    onClick={() => setCategoryFilter('appliance')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === 'appliance'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    Appliances
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddItemOpen(true)}
                    className="px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>

                  <button
                    onClick={handleResetChecklist}
                    className="px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl flex items-center gap-1.5 transition-colors min-h-[40px]"
                    title="Reset for next departure"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All</span>
                  </button>
                </div>
              </div>

              {/* Checklist Cards List */}
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <ChecklistCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    onOpenPhotoProof={(it) => setPhotoProofItem(it)}
                    onDeleteItem={
                      // Allow deleting custom items
                      item.id.startsWith('item-') ? handleDeleteItem : undefined
                    }
                  />
                ))}
              </div>
            </div>

            {/* Right 4 cols: Unified Household Presence & Activity */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-5 shadow-2xs">
                {/* 1. Departure Perimeter */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Departure Perimeter
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('geofence')}
                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      Radar View →
                    </button>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-950/70 rounded-xl p-3 border border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Position</div>
                      <div className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                        {Math.round(currentDistance)}m away
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                        currentDistance > (household?.geofence.radiusMeters || 75)
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {currentDistance > (household?.geofence.radiusMeters || 75) ? 'Outside Perimeter' : 'At Home'}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={handleTriggerSimulatedDeparture}
                      disabled={isSimulatingWalk}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors disabled:opacity-50 cursor-pointer min-h-[36px]"
                    >
                      {isSimulatingWalk ? 'Simulating...' : 'Test Departure'}
                    </button>
                    {currentDistance > 0 && (
                      <button
                        onClick={handleResetToHome}
                        className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer min-h-[36px]"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-stone-100 dark:border-stone-800" />

                {/* 2. Active Household Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Household Members
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('sync')}
                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      Sync Panel →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {household?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-stone-50 dark:bg-stone-950/60"
                      >
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {member.name} {member.name === currentMemberName ? '(You)' : ''}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                          {member.status === 'away' ? 'Away' : 'At Home'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-stone-100 dark:border-stone-800" />

                {/* 3. Recent Checks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      All Logs →
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {household?.activity && household.activity.length > 0 ? (
                      household.activity.slice(0, 3).map((evt) => (
                        <div key={evt.id} className="text-stone-600 dark:text-stone-400 py-1 border-b border-stone-100/60 dark:border-stone-800/60 last:border-0 flex items-start justify-between gap-2">
                          <span className="truncate">
                            <strong className="text-stone-800 dark:text-stone-200">{evt.memberName}</strong> · {evt.itemTitle ? `checked ${evt.itemTitle}` : evt.details}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-stone-400 dark:text-stone-500 text-xs py-1">No recent checks logged yet today.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Full Geofence View */}
        {activeTab === 'geofence' && household && (
          <DepartureSimulator
            geofence={household.geofence}
            currentDistance={currentDistance}
            isSimulating={isSimulatingWalk}
            onUpdateDistance={handleUpdateDistance}
            onSetHomeLocation={(lat, lng) => handleUpdateGeofence({ homeLatitude: lat, homeLongitude: lng })}
            onUpdateGeofence={handleUpdateGeofence}
            onTriggerSimulatedDeparture={handleTriggerSimulatedDeparture}
            onResetToHome={handleResetToHome}
            isRealGpsActive={isRealGpsActive}
            onToggleRealGps={toggleRealGps}
          />
        )}

        {/* Full Household Sync & Activity View */}
        {(activeTab === 'sync' || activeTab === 'activity') && household && (
          <HouseholdSyncPanel
            household={household}
            currentMemberId={household.members.find((m) => m.name === currentMemberName)?.id || ''}
            onSwitchMember={handleSwitchMember}
            onAddMember={handleAddMember}
            onSendNudge={handleSendNudge}
            onSwitchHouseholdCode={(newCode) => setHouseholdId(newCode)}
          />
        )}
      </main>

      {/* Nagging Departure Alert Modal */}
      <NagAlertModal
        isOpen={Boolean(household?.activeNagAlert)}
        uncheckedItems={household?.activeNagAlert?.uncheckedItems || []}
        distanceMeters={currentDistance}
        triggeredBy={household?.activeNagAlert?.triggeredByMember || currentMemberName}
        onDismiss={handleDismissNag}
        onRemoteCheckAll={handleRemoteCheckAll}
        onSnooze={handleSnoozeNag}
        onNudgeHousehold={() => {
          handleSendNudge('Alert: I departed home and noticed unchecked items!');
          handleDismissNag();
        }}
      />

      {/* Photo Proof Snapshot / View Modal */}
      <PhotoProofModal
        item={photoProofItem}
        onClose={() => setPhotoProofItem(null)}
        onSavePhoto={(id, url) => {
          handleSavePhotoProof(id, url);
          setPhotoProofItem(null);
        }}
        onDeletePhoto={handleDeletePhotoProof}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAdd={handleAddItem}
      />

      {/* Rapid Tap Outing Fullscreen Mode */}
      {isQuickOutingOpen && (
        <QuickOutingMode
          items={items}
          currentMemberName={currentMemberName}
          onToggleItem={handleToggleItem}
          onOpenPhotoProof={(it) => setPhotoProofItem(it)}
          onClose={() => setIsQuickOutingOpen(false)}
          onResetAll={handleResetChecklist}
        />
      )}

      {/* Switch Member / Quick Profile Modal */}
      {isSwitchMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Active Member Profile
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select who is checking off items on this phone or tablet:
            </p>

            <div className="space-y-2">
              {household?.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    handleSwitchMember(m.id);
                    setIsSwitchMemberModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    m.name === currentMemberName
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span>{m.name}</span>
                  {m.name === currentMemberName && <span>Active</span>}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Or new name..."
                value={newMemberInputName}
                onChange={(e) => setNewMemberInputName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
              <button
                onClick={() => {
                  if (newMemberInputName.trim()) {
                    handleAddMember(newMemberInputName.trim(), 'indigo');
                    setNewMemberInputName('');
                    setIsSwitchMemberModalOpen(false);
                  }
                }}
                className="px-3 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors"
              >
                Save
              </button>
            </div>

            <button
              onClick={() => setIsSwitchMemberModalOpen(false)}
              className="w-full py-2 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quiet Minimalist Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-4 mt-12 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Did I Lock It? — Household Departure Safety & Geofence</span>
          <span className="font-mono text-stone-400 dark:text-stone-500">
            Household: {household?.code || householdId} · Multi-Device Sync Active
          </span>
        </div>
      </footer>

      {/* Thumb-driven Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickOuting={() => setIsQuickOutingOpen(true)}
        onOpenAddItem={() => setIsAddItemOpen(true)}
        uncheckedCount={totalItems - checkedItems}
      />
    </div>
  );
}
