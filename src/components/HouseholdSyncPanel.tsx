import React, { useState } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  UserPlus, 
  Send, 
  Activity, 
  MapPin, 
  Clock, 
  Home, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import type { HouseholdState, HouseholdMember } from '../types.js';

interface HouseholdSyncPanelProps {
  household: HouseholdState;
  currentMemberId: string;
  onSwitchMember: (memberId: string) => void;
  onAddMember: (name: string, avatarColor: string) => void;
  onSendNudge: (message: string) => void;
  onSwitchHouseholdCode: (code: string) => void;
}

const AVATAR_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600', text: 'text-indigo-600' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-600', text: 'text-teal-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-600', text: 'text-rose-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-600', text: 'text-amber-600' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600' },
];

export const HouseholdSyncPanel: React.FC<HouseholdSyncPanelProps> = ({
  household,
  currentMemberId,
  onSwitchMember,
  onAddMember,
  onSendNudge,
  onSwitchHouseholdCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [nudgeSent, setNudgeSent] = useState(false);
  const [isSwitchingHouse, setIsSwitchingHouse] = useState(false);
  const [inputHouseholdCode, setInputHouseholdCode] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(household.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim(), selectedColor);
    setNewMemberName('');
    setIsAddingMember(false);
  };

  const handleSendNudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nudgeMessage.trim()) return;
    onSendNudge(nudgeMessage.trim());
    setNudgeMessage('');
    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 3000);
  };

  const handleHouseholdCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHouseholdCode.trim()) return;
    onSwitchHouseholdCode(inputHouseholdCode.trim().toUpperCase());
    setInputHouseholdCode('');
    setIsSwitchingHouse(false);
  };

  return (
    <div className="space-y-6">
      {/* Household Sync Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-stone-700 dark:text-stone-300" />
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {household.name}
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Multi-user household sync keeps everyone aligned on locked doors, stove safety, and departure alerts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyCode}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-mono rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center gap-2 transition-colors min-h-[42px] cursor-pointer"
              title="Copy household invite code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="font-semibold whitespace-nowrap">Code: {household.code}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                {copiedCode ? '(Copied!)' : '(Tap to copy)'}
              </span>
            </button>

            <button
              onClick={() => setIsSwitchingHouse(!isSwitchingHouse)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors min-h-[42px] flex items-center justify-center cursor-pointer whitespace-nowrap"
            >
              {isSwitchingHouse ? 'Close Code Input' : 'Join / Change Code'}
            </button>
          </div>
        </div>

        {/* Change / Join Household Code Form */}
        {isSwitchingHouse && (
          <form onSubmit={handleHouseholdCodeSubmit} className="p-4 bg-stone-50 dark:bg-stone-950/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300">Enter Household Code</h3>
              <button
                type="button"
                onClick={() => setIsSwitchingHouse(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs p-1 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Enter an existing household code (e.g. "HOME-4821" or "APT-12B") to sync with your roommates or family members across their phones.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="e.g. HOME-9021"
                value={inputHouseholdCode}
                onChange={(e) => setInputHouseholdCode(e.target.value)}
                className="w-full sm:flex-1 min-w-0 px-3 py-2 text-sm uppercase font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 min-h-[42px]"
                autoFocus
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  Sync Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsSwitchingHouse(false)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Active Household Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Household Members ({household.members.length})
            </h3>
            <button
              onClick={() => setIsAddingMember(true)}
              className="text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 min-h-[36px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {household.members.map((member) => {
              const isCurrent = member.id === currentMemberId;
              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-stone-50 dark:bg-stone-950/80 border-stone-900 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          member.avatarColor === 'indigo'
                            ? 'bg-indigo-600'
                            : member.avatarColor === 'teal'
                            ? 'bg-teal-600'
                            : member.avatarColor === 'rose'
                            ? 'bg-rose-600'
                            : member.avatarColor === 'amber'
                            ? 'bg-amber-600'
                            : member.avatarColor === 'emerald'
                            ? 'bg-emerald-600'
                            : 'bg-purple-600'
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate flex items-center gap-1">
                          {member.name}
                          {isCurrent && (
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                          <span>
                            {member.status === 'away'
                              ? 'Away'
                              : member.status === 'departing'
                              ? 'Departing'
                              : 'At Home'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => onSwitchMember(member.id)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Member Drawer */}
        {isAddingMember && (
          <form onSubmit={handleAddMemberSubmit} className="p-4 bg-stone-50 dark:bg-stone-950/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">Add Household Member</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Name (e.g. Jordan, Mom, Roommate)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full sm:flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 min-h-[42px]"
                autoFocus
              />
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto py-1">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-7 h-7 rounded-full shrink-0 cursor-pointer ${color.bg} ${
                      selectedColor === color.id ? 'ring-2 ring-stone-900 dark:ring-white ring-offset-2 dark:ring-offset-stone-900' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[42px] cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Nudge Household Tool */}
        <div className="bg-stone-50/70 dark:bg-stone-950/60 rounded-xl p-4 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Nudge Household
              </h3>
            </div>
            {nudgeSent && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Nudge Broadcasted!
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Out and worried you left something running? Send an instant ping to everyone currently at home.
          </p>

          <form onSubmit={handleSendNudgeSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g., Can someone verify if the stove burner was shut off?"
              value={nudgeMessage}
              onChange={(e) => setNudgeMessage(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 min-h-[40px]"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Nudge</span>
            </button>
          </form>
        </div>
      </div>

      {/* Real-time Activity Stream */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Household Safety Activity Log
            </h2>
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">Live Sync</span>
        </div>

        {household.activity.length === 0 ? (
          <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
            No activity yet. Start tapping checklist items to see live logs!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {household.activity.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-stone-50/70 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {event.memberName}
                    </span>{' '}
                    <span className="text-stone-600 dark:text-stone-400">
                      {event.itemTitle ? (
                        <>
                          {event.action === 'check' ? 'checked' : 'unlocked'}{' '}
                          <strong className="text-stone-900 dark:text-stone-100">{event.itemTitle}</strong>
                        </>
                      ) : (
                        event.details
                      )}
                    </span>
                    {event.itemTitle && event.details && (
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {event.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-stone-400 dark:text-stone-500 font-mono shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
