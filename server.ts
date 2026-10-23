import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { HouseholdState, ChecklistItem, HouseholdMember, ActivityEvent } from './src/types.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In AI Studio and containerized iframe environments, disable HMR WebSocket to prevent connection errors
process.env.DISABLE_HMR = 'true';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.resolve(DATA_DIR, 'households.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}

// Increase body parser limit to support camera photo verification
app.use(express.json({ limit: '15mb' }));

// In-memory household storage
const households: Map<string, HouseholdState> = new Map();

// Load persisted households from disk on startup
function loadHouseholdsFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Record<string, HouseholdState> = JSON.parse(raw);
      for (const [id, state] of Object.entries(parsed)) {
        households.set(id, state);
      }
      console.log(`Loaded ${households.size} households from disk.`);
    }
  } catch (e) {
    console.warn('Could not load households from disk:', e);
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function persistHouseholdsToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const obj: Record<string, HouseholdState> = {};
      for (const [id, state] of households.entries()) {
        obj[id] = state;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist households to disk:', e);
    }
  }, 500);
}

// Load on boot
loadHouseholdsFromDisk();

// SSE client listeners
const sseClients: Map<string, Set<Response>> = new Map();

function broadcastHouseholdUpdate(householdId: string) {
  const household = households.get(householdId);
  if (!household) return;
  persistHouseholdsToDisk();
  const clients = sseClients.get(householdId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(household)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch {
        clients.delete(res);
      }
    }
  }
}

// Send SSE heartbeat every 15 seconds to prevent browser/proxy connection timeouts
setInterval(() => {
  for (const [, clients] of sseClients.entries()) {
    for (const res of clients) {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clients.delete(res);
      }
    }
  }
}, 15000);

function createDefaultItems(): ChecklistItem[] {
  return [
    {
      id: 'door-front',
      title: 'Front Door Deadbolt',
      category: 'door',
      description: 'Turn upper deadbolt clockwise and test handle from outside',
      checked: false,
      isCritical: true,
    },
    {
      id: 'appliance-stove',
      title: 'Kitchen Stove & Oven',
      category: 'appliance',
      description: 'All 4 burner dials pushed in/off, oven display dark',
      checked: false,
      isCritical: true,
    },
    {
      id: 'appliance-iron',
      title: 'Hair Flat Iron / Curling Wand',
      category: 'appliance',
      description: 'Unplugged from wall socket and resting on heat mat',
      checked: false,
      isCritical: true,
    },
    {
      id: 'door-garage',
      title: 'Garage Overhead Door',
      category: 'door',
      description: 'Check seal contacts floor, side release latched',
      checked: false,
      isCritical: true,
    },
    {
      id: 'security-windows',
      title: 'Ground Floor Windows & Balcony',
      category: 'security',
      description: 'Living room sliders latched with security bar inserted',
      checked: false,
      isCritical: false,
    },
    {
      id: 'appliance-coffee',
      title: 'Coffee Maker / Electric Kettle',
      category: 'appliance',
      description: 'Base switch flipped off, hot plate cold',
      checked: false,
      isCritical: false,
    },
    {
      id: 'pet-check',
      title: 'Pets Safe & Fresh Water Bowl',
      category: 'pet',
      description: 'Pets safely indoors, fresh bowl filled, treat dropped',
      checked: false,
      isCritical: false,
    },
  ];
}

function getOrCreateHousehold(id: string): HouseholdState {
  const cleanId = id.toUpperCase().trim() || 'HOME-4821';
  if (!households.has(cleanId)) {
    const now = new Date().toISOString();
    const newHousehold: HouseholdState = {
      id: cleanId,
      name: cleanId === 'HOME-4821' ? 'Maplewood Residence' : `Household ${cleanId}`,
      code: cleanId,
      items: createDefaultItems(),
      members: [
        {
          id: 'user-default-1',
          name: 'Sarah M.',
          avatarColor: 'indigo',
          status: 'at_home',
          distanceFromHomeMeters: 5,
          lastActive: now,
        },
        {
          id: 'user-default-2',
          name: 'Alex T.',
          avatarColor: 'teal',
          status: 'at_home',
          distanceFromHomeMeters: 10,
          lastActive: now,
        },
      ],
      activity: [
        {
          id: 'act-init',
          timestamp: now,
          memberName: 'System',
          action: 'reset',
          details: 'Checklist initialized for departure safety',
        },
      ],
      geofence: {
        homeLatitude: 37.7749,
        homeLongitude: -122.4194,
        homeAddress: 'Home Sweet Home',
        radiusMeters: 75,
        nagEnabled: true,
        soundEnabled: true,
        nagIntervalSeconds: 30,
      },
      lastOutingResetAt: now,
      activeNagAlert: null,
    };
    households.set(cleanId, newHousehold);
  }
  return households.get(cleanId)!;
}

// Ensure default household exists at boot
getOrCreateHousehold('HOME-4821');

// API Routes
app.get('/api/household/:id', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  res.json(household);
});

// SSE endpoint for live sync across devices
app.get('/api/household/:id/stream', (req: Request, res: Response) => {
  const householdId = (req.params.id || 'HOME-4821').toUpperCase().trim();
  getOrCreateHousehold(householdId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(householdId)) {
    sseClients.set(householdId, new Set());
  }
  const clientSet = sseClients.get(householdId)!;
  clientSet.add(res);

  // Send initial data
  const household = households.get(householdId)!;
  res.write(`data: ${JSON.stringify(household)}\n\n`);

  req.on('close', () => {
    clientSet.delete(res);
  });
});

// Toggle or set checklist item state
app.post('/api/household/:id/item/:itemId/check', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { itemId } = req.params;
  const { checked, memberName, photoProofUrl, notes } = req.body;

  const item = household.items.find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  const now = new Date().toISOString();
  item.checked = checked !== undefined ? Boolean(checked) : !item.checked;
  item.checkedBy = item.checked ? (memberName || 'Household Member') : undefined;
  item.checkedAt = item.checked ? now : undefined;
  if (photoProofUrl !== undefined) {
    item.photoProofUrl = photoProofUrl;
  }
  if (notes !== undefined) {
    item.notes = notes;
  }

  const event: ActivityEvent = {
    id: `act-${Date.now()}`,
    timestamp: now,
    memberName: memberName || 'Household Member',
    action: item.checked ? 'check' : 'uncheck',
    itemTitle: item.title,
    details: item.checked
      ? (photoProofUrl ? 'Verified with photo proof' : 'Marked safe and locked')
      : 'Unchecked',
  };
  household.activity.unshift(event);
  if (household.activity.length > 50) {
    household.activity = household.activity.slice(0, 50);
  }

  // If all items are now checked, dismiss any active nag alert
  const remainingUnchecked = household.items.filter((i) => !i.checked);
  if (remainingUnchecked.length === 0 && household.activeNagAlert) {
    household.activeNagAlert = null;
  }

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, item, household });
});

// Reset checklist for a new outing
app.post('/api/household/:id/reset', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { memberName } = req.body;
  const now = new Date().toISOString();

  household.items = household.items.map((i) => ({
    ...i,
    checked: false,
    checkedBy: undefined,
    checkedAt: undefined,
    photoProofUrl: undefined,
  }));
  household.lastOutingResetAt = now;
  household.activeNagAlert = null;

  const event: ActivityEvent = {
    id: `act-${Date.now()}`,
    timestamp: now,
    memberName: memberName || 'Household Member',
    action: 'reset',
    details: 'Reset all items for a new departure outing',
  };
  household.activity.unshift(event);

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, household });
});

// Add custom checklist item
app.post('/api/household/:id/item', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { title, category, description, isCritical, memberName } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const newItem: ChecklistItem = {
    id: `item-${Date.now()}`,
    title: title.trim(),
    category: category || 'general',
    description: description || '',
    checked: false,
    isCritical: Boolean(isCritical),
  };

  household.items.push(newItem);

  const event: ActivityEvent = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    memberName: memberName || 'Household Member',
    action: 'check',
    itemTitle: newItem.title,
    details: 'Added new checklist item',
  };
  household.activity.unshift(event);

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, item: newItem, household });
});

// Delete item
app.delete('/api/household/:id/item/:itemId', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { itemId } = req.params;
  const removed = household.items.find((i) => i.id === itemId);
  household.items = household.items.filter((i) => i.id !== itemId);

  if (removed) {
    household.activity.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'Household Member',
      action: 'uncheck',
      itemTitle: removed.title,
      details: 'Removed checklist item',
    });
  }

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, household });
});

// Join or update member profile
app.post('/api/household/:id/member', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { id, name, avatarColor } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const now = new Date().toISOString();
  const existingIndex = household.members.findIndex((m) => m.id === id || m.name.toLowerCase() === name.toLowerCase());

  if (existingIndex >= 0) {
    household.members[existingIndex] = {
      ...household.members[existingIndex],
      name,
      avatarColor: avatarColor || household.members[existingIndex].avatarColor,
      lastActive: now,
    };
  } else {
    const newMember: HouseholdMember = {
      id: id || `member-${Date.now()}`,
      name,
      avatarColor: avatarColor || 'indigo',
      status: 'at_home',
      distanceFromHomeMeters: 0,
      lastActive: now,
    };
    household.members.push(newMember);
  }

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, members: household.members });
});

// Location / Departure status update
app.post('/api/household/:id/location', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { memberId, memberName, distanceFromHomeMeters, status } = req.body;

  const member = household.members.find((m) => m.id === memberId || m.name === memberName);
  const now = new Date().toISOString();

  if (member) {
    member.distanceFromHomeMeters = distanceFromHomeMeters;
    member.status = status;
    member.lastActive = now;
  }

  // Check geofence logic: if departing or away and distance > geofence radius
  const radius = household.geofence.radiusMeters;
  const isLeaving = distanceFromHomeMeters >= radius || status === 'away';
  const isBackHome = distanceFromHomeMeters <= radius * 0.4 || status === 'at_home';
  const uncheckedItems = household.items.filter((i) => !i.checked);

  let nagFired = false;

  // Auto-dismiss nag alert if the member who left returned home!
  if (isBackHome && household.activeNagAlert && household.activeNagAlert.triggeredByMember === (memberName || 'Someone')) {
    household.activeNagAlert = null;
    household.activity.unshift({
      id: `act-${Date.now()}`,
      timestamp: now,
      memberName: memberName || 'Household Member',
      action: 'check',
      details: 'Returned home safely (Nagging alert auto-cleared)',
    });
  } else if (isLeaving && uncheckedItems.length > 0 && household.geofence.nagEnabled) {
    // Check if snooze is active
    const isSnoozed =
      household.activeNagAlert?.snoozedUntil &&
      new Date(household.activeNagAlert.snoozedUntil).getTime() > Date.now();

    if (!isSnoozed) {
      nagFired = true;
      household.activeNagAlert = {
        triggeredByMember: memberName || 'Someone',
        triggeredAt: now,
        uncheckedCount: uncheckedItems.length,
        uncheckedItems: uncheckedItems.map((i) => i.title),
      };

      household.activity.unshift({
        id: `act-${Date.now()}`,
        timestamp: now,
        memberName: memberName || 'Departure Monitor',
        action: 'nag_triggered',
        details: `Left house (${Math.round(distanceFromHomeMeters)}m away) with ${uncheckedItems.length} unchecked items!`,
      });
    }
  }

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, nagFired, activeNagAlert: household.activeNagAlert });
});

// Nag Acknowledge / Snooze
app.post('/api/household/:id/nag-ack', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { action, snoozeMinutes, memberName } = req.body;
  const now = new Date();

  if (action === 'dismiss' || action === 'remote_check_all') {
    if (action === 'remote_check_all') {
      household.items = household.items.map((i) => ({
        ...i,
        checked: true,
        checkedBy: `${memberName || 'Remote'} (Remote Override)`,
        checkedAt: now.toISOString(),
      }));
    }
    household.activeNagAlert = null;
  } else if (action === 'snooze') {
    const minutes = snoozeMinutes || 5;
    const snoozedUntil = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
    if (household.activeNagAlert) {
      household.activeNagAlert.snoozedUntil = snoozedUntil;
    }
  }

  household.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: now.toISOString(),
    memberName: memberName || 'Household Member',
    action: 'check',
    details: action === 'remote_check_all' ? 'Remotely confirmed all items locked' : `Nag alert ${action}d`,
  });

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, household });
});

// Household nudge (broadcast to everyone in the household)
app.post('/api/household/:id/nudge', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { memberName, message } = req.body;
  const now = new Date().toISOString();

  household.activeNudgeAlert = {
    id: `nudge-${Date.now()}`,
    fromMember: memberName || 'Household Member',
    message: message || 'Nudge: Did we lock up everything?',
    timestamp: now,
  };

  household.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: now,
    memberName: memberName || 'Household Member',
    action: 'nudge',
    details: message || 'Nudged household: "Did we lock up everything?"',
  });

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, household });
});

// Acknowledge / dismiss active nudge
app.post('/api/household/:id/nudge-ack', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  household.activeNudgeAlert = null;
  broadcastHouseholdUpdate(household.id);
  res.json({ success: true });
});

// Update Geofence settings
app.post('/api/household/:id/geofence', (req: Request, res: Response) => {
  const household = getOrCreateHousehold(req.params.id);
  const { homeLatitude, homeLongitude, homeAddress, radiusMeters, nagEnabled, soundEnabled } = req.body;

  if (homeLatitude !== undefined) household.geofence.homeLatitude = homeLatitude;
  if (homeLongitude !== undefined) household.geofence.homeLongitude = homeLongitude;
  if (homeAddress !== undefined) household.geofence.homeAddress = homeAddress;
  if (radiusMeters !== undefined) household.geofence.radiusMeters = radiusMeters;
  if (nagEnabled !== undefined) household.geofence.nagEnabled = nagEnabled;
  if (soundEnabled !== undefined) household.geofence.soundEnabled = soundEnabled;

  broadcastHouseholdUpdate(household.id);
  res.json({ success: true, geofence: household.geofence });
});

// Mount Vite or serve static assets
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Did I Lock It server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
