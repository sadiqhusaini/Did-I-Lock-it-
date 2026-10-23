export type ItemCategory = 'door' | 'appliance' | 'security' | 'pet' | 'general';

export interface ChecklistItem {
  id: string;
  title: string;
  category: ItemCategory;
  description: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string; // ISO string
  photoProofUrl?: string;
  notes?: string;
  isCritical?: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  avatarColor: string;
  isCurrentDevice?: boolean;
  status: 'at_home' | 'departing' | 'away';
  distanceFromHomeMeters?: number;
  lastActive: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  memberName: string;
  action: 'check' | 'uncheck' | 'reset' | 'depart' | 'nag_triggered' | 'nudge';
  itemTitle?: string;
  details?: string;
}

export interface GeofenceSettings {
  homeLatitude: number;
  homeLongitude: number;
  homeAddress?: string;
  radiusMeters: number; // e.g. 50, 100, 200
  nagEnabled: boolean;
  soundEnabled: boolean;
  nagIntervalSeconds: number; // e.g. 30
}

export interface HouseholdState {
  id: string;
  name: string;
  code: string;
  items: ChecklistItem[];
  members: HouseholdMember[];
  activity: ActivityEvent[];
  geofence: GeofenceSettings;
  lastOutingResetAt: string;
  activeNagAlert?: {
    triggeredByMember: string;
    triggeredAt: string;
    uncheckedCount: number;
    uncheckedItems: string[];
    snoozedUntil?: string;
  } | null;
  activeNudgeAlert?: {
    id: string;
    fromMember: string;
    message: string;
    timestamp: string;
  } | null;
}
