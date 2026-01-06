import { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';

// HOMEKEEP v2.2 - Enhanced UI & Workflows
// Improvements: Progress rings, micro-animations, undo support, bulk actions, 
// quick complete gestures, better visual hierarchy, ARIA accessibility

const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

const lightColors = { brandOrange: '#f85a00', brandBlue: '#0055b8', navy: '#1a2b4a', slate: '#475569', gray: '#64748b', grayLight: '#94a3b8', bgPrimary: '#fafaf9', bgCard: '#ffffff', bgMuted: '#f1f0ee', border: '#e7e5e4', urgent: '#dc2626', urgentBg: '#fef2f2', success: '#22c55e', successBg: '#f0fdf4', text: '#1a2b4a', textMuted: '#64748b' };
const darkColors = { brandOrange: '#ff7a2e', brandBlue: '#60a5fa', navy: '#f1f5f9', slate: '#cbd5e1', gray: '#94a3b8', grayLight: '#64748b', bgPrimary: '#0f172a', bgCard: '#1e293b', bgMuted: '#334155', border: '#475569', urgent: '#f87171', urgentBg: '#7f1d1d', success: '#4ade80', successBg: '#166534', text: '#f1f5f9', textMuted: '#94a3b8' };
const catColors = { HVAC: '#3b82f6', Safety: '#ef4444', Plumbing: '#06b6d4', Laundry: '#a855f7', Kitchen: '#f97316', Electrical: '#eab308', Exterior: '#22c55e', Seasonal: '#ec4899', Equipment: '#78716c' };
const sp = { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' };

// Global CSS for animations
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes checkmark { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
    @keyframes progressFill { from { stroke-dashoffset: 100; } to { stroke-dashoffset: var(--progress); } }
    @keyframes ripple { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(4); opacity: 0; } }
    @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-100px) rotate(720deg); opacity: 0; } }
    .task-card { transition: all 0.2s ease; }
    .task-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .task-card:active { transform: scale(0.98); }
    .btn-press { transition: all 0.15s ease; }
    .btn-press:active { transform: scale(0.95); }
    .stagger-1 { animation-delay: 0.05s; }
    .stagger-2 { animation-delay: 0.1s; }
    .stagger-3 { animation-delay: 0.15s; }
    .stagger-4 { animation-delay: 0.2s; }
    .stagger-5 { animation-delay: 0.25s; }
    input:focus, button:focus-visible { outline: 2px solid #f85a00; outline-offset: 2px; }
    * { -webkit-tap-highlight-color: transparent; }
  `}</style>
);

// Progress Ring Component
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, color, bgColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
};

// Toast/Snackbar for undo functionality
const Toast = ({ message, action, onAction, onClose, colors }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: colors.navy, color: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000, animation: 'slideUp 0.3s ease' }}>
      <span style={{ fontSize: '14px' }}>{message}</span>
      {action && <button onClick={onAction} style={{ background: colors.brandOrange, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{action}</button>}
    </div>
  );
};

const STORAGE_KEYS = { TASKS: 'homekeep_tasks', SETTINGS: 'homekeep_settings', SETUP: 'homekeep_setup' };
const saveTasks = async (tasks) => { try { await window.storage.set(STORAGE_KEYS.TASKS, JSON.stringify(tasks.map(t => ({ ...t, lastDone: t.lastDone?.toISOString() || null, nextDue: t.nextDue?.toISOString() || null, completions: t.completions || [] })))); } catch(e){} };
const loadTasks = async () => { try { const r = await window.storage.get(STORAGE_KEYS.TASKS); if(r?.value) return JSON.parse(r.value).map(t => ({ ...t, lastDone: t.lastDone ? new Date(t.lastDone) : null, nextDue: t.nextDue ? new Date(t.nextDue) : null, completions: t.completions || [] })); } catch(e){} return null; };
const saveSettings = async (s) => { try { await window.storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(s)); } catch(e){} };
const loadSettings = async () => { try { const r = await window.storage.get(STORAGE_KEYS.SETTINGS); if(r?.value) return { darkMode: false, reminderTime: '09:00', ...JSON.parse(r.value) }; } catch(e){} return { darkMode: false, reminderTime: '09:00' }; };
const saveSetup = async () => { try { await window.storage.set(STORAGE_KEYS.SETUP, 'done'); } catch(e){} };
const loadSetup = async () => { try { const r = await window.storage.get(STORAGE_KEYS.SETUP); return r?.value === 'done'; } catch(e){ return false; } };

const taskTemplates = [
  // HVAC - heating/cooling specific
  { title: 'Replace HVAC Filter', category: 'HVAC', frequencyDays: 90, notes: 'Check monthly with pets.', priority: true, requires: { heating: ['forced_air', 'heat_pump'] } },
  { title: 'Schedule HVAC Tune-Up', category: 'HVAC', frequencyDays: 365, notes: 'Spring AC, fall heating.', requires: { heating: ['forced_air', 'heat_pump'] } },
  { title: 'Clean AC Coils', category: 'HVAC', frequencyDays: 365, notes: 'Outdoor unit.', requires: { cooling: ['central_ac', 'heat_pump'] } },
  { title: 'Replace Thermostat Batteries', category: 'HVAC', frequencyDays: 365, notes: 'Prevents shutdowns.' },
  { title: 'Check Ductwork for Leaks', category: 'HVAC', frequencyDays: 365, notes: 'Inspect accessible ducts.', requires: { heating: ['forced_air'] } },
  { title: 'Clean Air Vents', category: 'HVAC', frequencyDays: 90, notes: 'Vacuum and wipe.', requires: { heating: ['forced_air', 'heat_pump'] } },
  { title: 'Bleed Radiators', category: 'HVAC', frequencyDays: 365, notes: 'Release trapped air.', requires: { heating: ['radiator'] } },
  { title: 'Clean Baseboard Heaters', category: 'HVAC', frequencyDays: 180, notes: 'Vacuum fins and covers.', requires: { heating: ['baseboard'] } },
  { title: 'Clean Window AC Filter', category: 'HVAC', frequencyDays: 30, notes: 'Rinse or replace filter.', requires: { cooling: ['window_ac'] } },
  
  // Safety - universal + specific
  { title: 'Test Smoke Detectors', category: 'Safety', frequencyDays: 30, notes: 'Press test button.', priority: true },
  { title: 'Replace Smoke Detector Batteries', category: 'Safety', frequencyDays: 180, notes: 'Replace all at once.', priority: true },
  { title: 'Test CO Detectors', category: 'Safety', frequencyDays: 30, notes: 'Critical with gas.', priority: true },
  { title: 'Check Fire Extinguisher', category: 'Safety', frequencyDays: 30, notes: 'Verify green zone.', priority: true },
  { title: 'Test Garage Door Reverse', category: 'Safety', frequencyDays: 30, notes: 'Place object in path.', requires: { features: ['garage'] } },
  { title: 'Check Dryer Vent Blockage', category: 'Safety', frequencyDays: 90, notes: 'Fire hazard.', requires: { features: ['washer_dryer'] } },
  { title: 'Inspect Stairs & Railings', category: 'Safety', frequencyDays: 180, notes: 'Check for loose parts.', requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Inspect Fireplace & Chimney', category: 'Safety', frequencyDays: 365, notes: 'Check for creosote buildup.', requires: { features: ['fireplace'] } },
  { title: 'Test Pool Safety Equipment', category: 'Safety', frequencyDays: 30, notes: 'Check gates, alarms, covers.', requires: { features: ['pool'] } },
  
  // Plumbing
  { title: 'Flush Water Heater', category: 'Plumbing', frequencyDays: 365, notes: 'Removes sediment.', priority: true, requires: { waterHeater: ['tank'] } },
  { title: 'Descale Tankless Water Heater', category: 'Plumbing', frequencyDays: 365, notes: 'Vinegar flush.', requires: { waterHeater: ['tankless'] } },
  { title: 'Inspect Under Sink Leaks', category: 'Plumbing', frequencyDays: 90, notes: 'All kitchens/baths.', priority: true },
  { title: 'Test Sump Pump', category: 'Plumbing', frequencyDays: 90, notes: 'Pour water to test.', requires: { features: ['sump_pump'] } },
  { title: 'Clean Faucet Aerators', category: 'Plumbing', frequencyDays: 180, notes: 'Vinegar soak.' },
  { title: 'Check Water Pressure', category: 'Plumbing', frequencyDays: 180, notes: 'Should be 40-60 PSI.' },
  { title: 'Inspect Toilet Flappers', category: 'Plumbing', frequencyDays: 180, notes: 'Check for leaks.' },
  { title: 'Clean Showerheads', category: 'Plumbing', frequencyDays: 90, notes: 'Vinegar soak overnight.' },
  { title: 'Test Well Pump Pressure', category: 'Plumbing', frequencyDays: 180, notes: 'Check pressure tank.', requires: { features: ['well_water'] } },
  { title: 'Inspect Septic System', category: 'Plumbing', frequencyDays: 365, notes: 'Check for issues, pump every 3-5 years.', requires: { features: ['septic'] } },
  
  // Kitchen
  { title: 'Replace Fridge Water Filter', category: 'Kitchen', frequencyDays: 180, notes: 'Check fridge model.', priority: true },
  { title: 'Clean Fridge Coils', category: 'Kitchen', frequencyDays: 180, notes: 'Behind/under fridge.' },
  { title: 'Clean Range Hood Filter', category: 'Kitchen', frequencyDays: 90, notes: 'Dishwasher safe.' },
  { title: 'Clean Garbage Disposal', category: 'Kitchen', frequencyDays: 30, notes: 'Ice + citrus.' },
  { title: 'Clean Dishwasher Filter', category: 'Kitchen', frequencyDays: 30, notes: 'Bottom of unit.' },
  { title: 'Clean Oven', category: 'Kitchen', frequencyDays: 90, notes: 'Self-clean or manual.' },
  { title: 'Clean Microwave', category: 'Kitchen', frequencyDays: 30, notes: 'Steam with water + lemon.' },
  
  // Laundry
  { title: 'Clean Dryer Vent', category: 'Laundry', frequencyDays: 365, notes: 'Fire prevention.', priority: true, requires: { features: ['washer_dryer'] } },
  { title: 'Clean Washing Machine', category: 'Laundry', frequencyDays: 30, notes: 'Hot cycle + cleaner.', requires: { features: ['washer_dryer'] } },
  { title: 'Clean Dryer Lint Trap', category: 'Laundry', frequencyDays: 7, notes: 'After every load ideally.', requires: { features: ['washer_dryer'] } },
  { title: 'Inspect Washer Hoses', category: 'Laundry', frequencyDays: 180, notes: 'Replace if bulging.', requires: { features: ['washer_dryer'] } },
  
  // Exterior - house owners only
  { title: 'Clean Gutters', category: 'Exterior', frequencyDays: 180, notes: 'Spring and fall.', priority: true, requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Inspect Roof', category: 'Exterior', frequencyDays: 365, notes: 'Check shingles.', requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Check Exterior Caulking', category: 'Exterior', frequencyDays: 365, notes: 'Windows, doors.', requires: { homeType: ['house', 'townhouse', 'condo'] } },
  { title: 'Inspect Foundation', category: 'Exterior', frequencyDays: 365, notes: 'Look for cracks.', requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Clean Deck/Patio', category: 'Exterior', frequencyDays: 180, notes: 'Power wash if needed.', requires: { features: ['deck_patio'] } },
  { title: 'Trim Trees Near House', category: 'Exterior', frequencyDays: 365, notes: 'Keep away from roof.', requires: { features: ['yard'] } },
  { title: 'Maintain Pool/Hot Tub', category: 'Exterior', frequencyDays: 7, notes: 'Check chemicals and filters.', requires: { features: ['pool'] } },
  
  // Seasonal - Winterization
  { title: 'Winterize Outdoor Faucets', category: 'Seasonal', frequencyDays: 365, notes: 'Shut off water, drain pipes.', requires: { features: ['outdoor_faucets'] } },
  { title: 'Install Hose Spigot Covers', category: 'Seasonal', frequencyDays: 365, notes: 'Foam insulated covers prevent freezing.', requires: { features: ['outdoor_faucets'] } },
  { title: 'Blow Out Sprinkler Lines', category: 'Seasonal', frequencyDays: 365, notes: 'Use air compressor before freeze.', requires: { features: ['sprinklers'] } },
  { title: 'Cover AC Condenser Unit', category: 'Seasonal', frequencyDays: 365, notes: 'Protect from winter debris.', requires: { features: ['central_ac_unit'] } },
  { title: 'Cover Wall AC Unit', category: 'Seasonal', frequencyDays: 365, notes: 'Inside cover or remove unit for winter.', requires: { features: ['wall_ac'] } },
  { title: 'Check Weather Stripping', category: 'Seasonal', frequencyDays: 365, notes: 'Doors and windows.' },
  { title: 'Reverse Ceiling Fans', category: 'Seasonal', frequencyDays: 180, notes: 'Clockwise in winter.' },
  { title: 'Check Attic Insulation', category: 'Seasonal', frequencyDays: 365, notes: 'Before winter.', requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Drain Garden Hoses', category: 'Seasonal', frequencyDays: 365, notes: 'Disconnect and drain before freeze.', requires: { features: ['yard'] } },
  { title: 'Service Heating System', category: 'Seasonal', frequencyDays: 365, notes: 'Schedule tune-up before winter.', requires: { heating: ['forced_air', 'heat_pump', 'radiator'] } },
  { title: 'Stock Winter Supplies', category: 'Seasonal', frequencyDays: 365, notes: 'Salt, sand, shovels ready.', requires: { homeType: ['house', 'townhouse'] } },
  { title: 'Test Sump Pump Before Spring', category: 'Seasonal', frequencyDays: 365, notes: 'Ready for snowmelt.', requires: { features: ['sump_pump'] } },
  { title: 'Spring AC Tune-Up', category: 'Seasonal', frequencyDays: 365, notes: 'Service before summer.', requires: { cooling: ['central_ac', 'heat_pump'] } },
  { title: 'Uncover AC Unit in Spring', category: 'Seasonal', frequencyDays: 365, notes: 'Remove cover, check for debris.', requires: { features: ['central_ac_unit'] } },
  { title: 'Start Up Sprinkler System', category: 'Seasonal', frequencyDays: 365, notes: 'Check heads, adjust timers.', requires: { features: ['sprinklers'] } },
  
  // Equipment Maintenance
  { title: 'Lawn Mower - Change Oil', category: 'Equipment', frequencyDays: 365, notes: 'Every season or 50 hours.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Lawn Mower - Replace Spark Plug', category: 'Equipment', frequencyDays: 365, notes: 'Annual replacement.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Lawn Mower - Sharpen Blade', category: 'Equipment', frequencyDays: 365, notes: 'Dull blades damage grass.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Lawn Mower - Replace Air Filter', category: 'Equipment', frequencyDays: 365, notes: 'Check monthly, replace yearly.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Lawn Mower - Clean Deck', category: 'Equipment', frequencyDays: 30, notes: 'Scrape grass buildup.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Lawn Mower - Winterize', category: 'Equipment', frequencyDays: 365, notes: 'Stabilize fuel, clean, store properly.', requires: { equipment: ['lawn_mower'] } },
  { title: 'Snow Blower - Change Oil', category: 'Equipment', frequencyDays: 365, notes: 'Before winter season.', requires: { equipment: ['snow_blower'] } },
  { title: 'Snow Blower - Replace Spark Plug', category: 'Equipment', frequencyDays: 365, notes: 'Annual replacement.', requires: { equipment: ['snow_blower'] } },
  { title: 'Snow Blower - Check Shear Pins', category: 'Equipment', frequencyDays: 365, notes: 'Keep spares on hand.', requires: { equipment: ['snow_blower'] } },
  { title: 'Snow Blower - Check Belts', category: 'Equipment', frequencyDays: 365, notes: 'Look for cracks or wear.', requires: { equipment: ['snow_blower'] } },
  { title: 'Snow Blower - Lubricate', category: 'Equipment', frequencyDays: 365, notes: 'Grease fittings and chute.', requires: { equipment: ['snow_blower'] } },
  { title: 'Snow Blower - Summer Storage', category: 'Equipment', frequencyDays: 365, notes: 'Stabilize fuel, clean, cover.', requires: { equipment: ['snow_blower'] } },
  { title: 'String Trimmer - Replace Line', category: 'Equipment', frequencyDays: 90, notes: 'Check and refill as needed.', requires: { equipment: ['trimmer'] } },
  { title: 'String Trimmer - Clean Air Filter', category: 'Equipment', frequencyDays: 90, notes: 'Tap out debris.', requires: { equipment: ['trimmer'] } },
  { title: 'Leaf Blower - Clean Air Filter', category: 'Equipment', frequencyDays: 90, notes: 'Check before fall season.', requires: { equipment: ['leaf_blower'] } },
  { title: 'Chainsaw - Sharpen Chain', category: 'Equipment', frequencyDays: 180, notes: 'After every few uses.', requires: { equipment: ['chainsaw'] } },
  { title: 'Chainsaw - Check Bar Oil', category: 'Equipment', frequencyDays: 30, notes: 'Fill before each use.', requires: { equipment: ['chainsaw'] } },
  { title: 'Chainsaw - Clean Air Filter', category: 'Equipment', frequencyDays: 90, notes: 'Tap out sawdust.', requires: { equipment: ['chainsaw'] } },
  { title: 'Pressure Washer - Winterize', category: 'Equipment', frequencyDays: 365, notes: 'Drain pump, add antifreeze.', requires: { equipment: ['pressure_washer'] } },
  { title: 'Pressure Washer - Check Oil', category: 'Equipment', frequencyDays: 365, notes: 'Before season start.', requires: { equipment: ['pressure_washer'] } },
  { title: 'Generator - Run Monthly', category: 'Equipment', frequencyDays: 30, notes: 'Keep it ready for emergencies.', requires: { equipment: ['generator'] } },
  { title: 'Generator - Change Oil', category: 'Equipment', frequencyDays: 365, notes: 'Annual or after 100 hours.', requires: { equipment: ['generator'] } },
  { title: 'Generator - Test Under Load', category: 'Equipment', frequencyDays: 180, notes: 'Plug in appliances to test.', requires: { equipment: ['generator'] } },
  
  // Electrical
  { title: 'Test GFCI Outlets', category: 'Electrical', frequencyDays: 30, notes: 'Kitchen, bath, outdoor.', priority: true },
  { title: 'Check Electrical Panel', category: 'Electrical', frequencyDays: 365, notes: 'Look for issues.' },
  { title: 'Test AFCI Breakers', category: 'Electrical', frequencyDays: 30, notes: 'Bedroom circuits.' },
  { title: 'Check Outdoor Lighting', category: 'Electrical', frequencyDays: 90, notes: 'Replace bulbs.', requires: { homeType: ['house', 'townhouse'] } },
];

// Survey options
const surveyOptions = {
  homeType: [
    { id: 'house', label: 'House', icon: 'home' },
    { id: 'townhouse', label: 'Townhouse', icon: 'home' },
    { id: 'condo', label: 'Condo', icon: 'exterior' },
    { id: 'apartment', label: 'Apartment', icon: 'exterior' },
  ],
  heating: [
    { id: 'forced_air', label: 'Forced Air / Furnace', icon: 'hvac' },
    { id: 'heat_pump', label: 'Heat Pump', icon: 'hvac' },
    { id: 'baseboard', label: 'Baseboard', icon: 'electrical' },
    { id: 'radiator', label: 'Radiator', icon: 'plumbing' },
    { id: 'none', label: 'None / Other', icon: 'x' },
  ],
  cooling: [
    { id: 'central_ac', label: 'Central AC', icon: 'hvac' },
    { id: 'heat_pump', label: 'Heat Pump', icon: 'hvac' },
    { id: 'window_ac', label: 'Window Units', icon: 'hvac' },
    { id: 'none', label: 'None', icon: 'x' },
  ],
  waterHeater: [
    { id: 'tank', label: 'Tank', icon: 'plumbing' },
    { id: 'tankless', label: 'Tankless', icon: 'plumbing' },
    { id: 'unknown', label: "Don't Know", icon: 'info' },
  ],
  features: [
    { id: 'garage', label: 'Garage', icon: 'home' },
    { id: 'washer_dryer', label: 'Washer/Dryer', icon: 'laundry' },
    { id: 'fireplace', label: 'Fireplace', icon: 'home' },
    { id: 'sump_pump', label: 'Sump Pump', icon: 'plumbing' },
    { id: 'deck_patio', label: 'Deck/Patio', icon: 'exterior' },
    { id: 'yard', label: 'Yard/Lawn', icon: 'exterior' },
    { id: 'sprinklers', label: 'Sprinkler System', icon: 'plumbing' },
    { id: 'pool', label: 'Pool/Hot Tub', icon: 'exterior' },
    { id: 'septic', label: 'Septic System', icon: 'plumbing' },
    { id: 'well_water', label: 'Well Water', icon: 'plumbing' },
    { id: 'outdoor_faucets', label: 'Outdoor Faucets', icon: 'plumbing' },
    { id: 'central_ac_unit', label: 'AC Condenser Unit', icon: 'hvac' },
    { id: 'wall_ac', label: 'Wall AC Unit', icon: 'hvac' },
  ],
  equipment: [
    { id: 'lawn_mower', label: 'Lawn Mower', icon: 'exterior' },
    { id: 'snow_blower', label: 'Snow Blower', icon: 'seasonal' },
    { id: 'leaf_blower', label: 'Leaf Blower', icon: 'exterior' },
    { id: 'chainsaw', label: 'Chainsaw', icon: 'exterior' },
    { id: 'pressure_washer', label: 'Pressure Washer', icon: 'exterior' },
    { id: 'generator', label: 'Generator', icon: 'electrical' },
    { id: 'trimmer', label: 'String Trimmer', icon: 'exterior' },
  ],
};

// Filter tasks based on survey answers
const filterTasksForHome = (answers) => {
  return taskTemplates.filter(task => {
    if (!task.requires) return true; // No requirements = universal task
    
    for (const [key, allowedValues] of Object.entries(task.requires)) {
      const userValue = answers[key];
      if (!userValue) continue;
      
      if (Array.isArray(userValue)) {
        // For features/equipment (multi-select), check if ANY match
        if (!userValue.some(v => allowedValues.includes(v))) return false;
      } else {
        // For single-select, check if value matches
        if (!allowedValues.includes(userValue)) return false;
      }
    }
    return true;
  });
};

const essentialTasks = taskTemplates.filter(t => t.priority);
const categories = ['HVAC', 'Safety', 'Plumbing', 'Kitchen', 'Laundry', 'Exterior', 'Seasonal', 'Equipment', 'Electrical'];
const frequencyOptions = [{ label: 'Weekly', days: 7 }, { label: 'Every 2 weeks', days: 14 }, { label: 'Monthly', days: 30 }, { label: 'Every 3 months', days: 90 }, { label: 'Every 6 months', days: 180 }, { label: 'Yearly', days: 365 }];

const getDaysUntilDue = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const formatDueText = (d) => d < 0 ? { text: `${Math.abs(d)}d overdue`, isOverdue: true } : d === 0 ? { text: 'Due today', isOverdue: false } : d <= 7 ? { text: `${d}d left`, isOverdue: false } : { text: `${d} days`, isOverdue: false };
const categorizeTasks = (tasks) => { const now = new Date(), week = new Date(now - 604800000); const o=[], s=[], l=[], r=[]; tasks.forEach(t => { const d = getDaysUntilDue(t.nextDue); if(t.lastDone && new Date(t.lastDone) > week && d > 14) r.push(t); else if(d < 0) o.push(t); else if(d <= 14) s.push(t); else l.push(t); }); const sort = (a,b) => new Date(a.nextDue) - new Date(b.nextDue); return { overdue: o.sort(sort), dueSoon: s.sort(sort), later: l.sort(sort), done: r.sort((a,b) => new Date(b.lastDone) - new Date(a.lastDone)) }; };

const Icon = ({ name, size = 20, color = 'currentColor', ariaLabel }) => {
  const paths = { hvac: 'M3 8h18M3 16h18M12 3v18', safety: 'M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z', plumbing: 'M14 4h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM10 14v4a2 2 0 0 0 2 2a2 2 0 0 0 2-2v-4', laundry: 'M2 4h20v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', kitchen: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20', electrical: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', exterior: 'M3 21h18M5 21V7l7-4 7 4v14', seasonal: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2', check: 'M20 6L9 17l-5-5', x: 'M18 6L6 18M6 6l12 12', plus: 'M12 5v14M5 12h14', camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', scan: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10', calendar: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18', note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', youtube: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02l5.75-3.27-5.75-3.27v6.54z', mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', alertCircle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01', checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3', package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12', home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', sparkles: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z', trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-1.18-2.82H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.82-1.18V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.18 2.82H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z', clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2', download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3', upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z', arrowRight: 'M5 12h14M12 5l7 7-7 7', chevronRight: 'M9 18l6-6-6-6', sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z', moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', barChart: 'M12 20V10M18 20V4M6 20v-4', trendingUp: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6', award: 'M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 22l3-3 3 3', target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01', smartphone: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01', share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13', search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35', filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={!ariaLabel} aria-label={ariaLabel} role={ariaLabel ? 'img' : 'presentation'}><path d={paths[name]} /></svg>;
};
const getCategoryIcon = (c) => ({ HVAC: 'hvac', Safety: 'safety', Plumbing: 'plumbing', Laundry: 'laundry', Kitchen: 'kitchen', Electrical: 'electrical', Exterior: 'exterior', Seasonal: 'seasonal', Equipment: 'settings' }[c] || 'home');

const Logo = ({ dark }) => <svg width="140" height="36" viewBox="0 0 280 72"><path d="M8 45V65c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V45" fill={dark ? '#ff7a2e' : '#f85a00'}/><path d="M4 45L28 20 52 45" stroke={dark ? '#ff7a2e' : '#f85a00'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M16 48l8 8 16-20" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><text x="68" y="52" fontFamily="system-ui" fontSize="36" fontWeight="700" fill={dark ? '#ff7a2e' : '#f85a00'}>home</text><text x="150" y="52" fontFamily="system-ui" fontSize="36" fontWeight="700" fill={dark ? '#60a5fa' : '#0055b8'}>Keep</text></svg>;

// Analytics
const calcAnalytics = (tasks) => {
  const now = new Date(), d30 = new Date(now - 30*86400000);
  let c30 = 0, total = 0, streak = 0;
  const catStats = {}, monthly = {};
  tasks.forEach(t => {
    const comps = t.completions || [];
    total += comps.length;
    if (!catStats[t.category]) catStats[t.category] = { tasks: 0, done: 0, overdue: 0 };
    catStats[t.category].tasks++;
    if (getDaysUntilDue(t.nextDue) < 0) catStats[t.category].overdue++;
    comps.forEach(c => {
      const dt = new Date(c);
      if (dt > d30) c30++;
      catStats[t.category].done++;
      const mk = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
      monthly[mk] = (monthly[mk]||0) + 1;
    });
  });
  const dates = new Set();
  tasks.forEach(t => (t.completions||[]).forEach(c => { const d = new Date(c); dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`); }));
  let check = new Date();
  while (dates.has(`${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`)) { streak++; check = new Date(check - 86400000); }
  const overdue = tasks.filter(t => getDaysUntilDue(t.nextDue) < 0).length;
  const score = Math.round(Math.min(100, Math.max(0, (tasks.length ? (100 - overdue/tasks.length*100)*0.8 : 100) + Math.min(20, c30*2))));
  return { c30, total, streak, catStats, monthly, score, overdue, taskCount: tasks.length };
};

const AnalyticsModal = ({ onClose, tasks }) => {
  const { colors } = useTheme();
  const a = calcAnalytics(tasks);
  const cats = Object.entries(a.catStats).sort((x,y) => y[1].done - x[1].done);
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth()-i); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; months.push({ k, label: d.toLocaleDateString('en-US',{month:'short'}), n: a.monthly[k]||0 }); }
  const max = Math.max(...months.map(m=>m.n), 1);
  
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e=>e.stopPropagation()} style={{ background:colors.bgPrimary, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'500px', maxHeight:'85vh', overflow:'auto', animation:'slideUp .3s ease' }}>
        <div style={{ padding:sp.lg, borderBottom:`1px solid ${colors.border}`, background:colors.bgCard, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
          <h3 style={{ margin:0, fontSize:'18px', fontWeight:'600', color:colors.text }}>Home Health</h3>
          <button onClick={onClose} style={{ background:colors.bgMuted, border:'none', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:colors.gray }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:sp.lg }}>
          <div style={{ background:colors.bgCard, borderRadius:'16px', padding:sp.lg, marginBottom:sp.md, border:`1px solid ${colors.border}`, textAlign:'center' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="target" size={18} color={colors.brandOrange}/><span style={{ fontSize:'13px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Health Score</span></div>
            <div style={{ fontSize:'52px', fontWeight:'700', color: a.score >= 80 ? colors.success : a.score >= 50 ? colors.brandOrange : colors.urgent, lineHeight:1 }}>{a.score}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:sp.xs, marginTop:sp.sm }}><Icon name={a.score >= 80 ? 'award' : a.score >= 50 ? 'trendingUp' : 'alertCircle'} size={16} color={a.score >= 80 ? colors.success : a.score >= 50 ? colors.brandOrange : colors.urgent}/><span style={{ fontSize:'14px', color:colors.textMuted }}>{a.score >= 80 ? 'Excellent!' : a.score >= 50 ? 'Good progress' : 'Needs attention'}</span></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:sp.sm, marginBottom:sp.md }}>
            {[{ icon:'checkCircle', color:colors.success, label:'Last 30 Days', value:a.c30, sub:'completed' },
              { icon:'award', color:colors.brandOrange, label:'Streak', value:a.streak, sub:'days' },
              { icon:'barChart', color:colors.brandBlue, label:'All Time', value:a.total, sub:'total' },
              { icon:'alertCircle', color:colors.urgent, label:'Overdue', value:a.overdue, sub:`of ${a.taskCount}` }
            ].map((s,i) => (
              <div key={i} style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, border:`1px solid ${colors.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:sp.xs, marginBottom:sp.xs }}><Icon name={s.icon} size={14} color={s.color}/><span style={{ fontSize:'11px', color:colors.textMuted }}>{s.label}</span></div>
                <div style={{ fontSize:'26px', fontWeight:'700', color: s.icon==='alertCircle' && s.value > 0 ? colors.urgent : colors.text }}>{s.value}</div>
                <div style={{ fontSize:'11px', color:colors.textMuted }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, marginBottom:sp.md, border:`1px solid ${colors.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="trendingUp" size={14} color={colors.brandBlue}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>6 Month Activity</span></div>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', height:'80px', gap:sp.xs }}>
              {months.map((m,i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', background:colors.bgMuted, borderRadius:'4px', height:'60px', position:'relative' }}>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:colors.brandBlue, borderRadius:'4px', height:`${(m.n/max)*100}%`, minHeight: m.n > 0 ? '4px' : '0' }}/>
                  </div>
                  <span style={{ fontSize:'10px', color:colors.textMuted }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          {cats.length > 0 && (
            <div style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, border:`1px solid ${colors.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="barChart" size={14} color={colors.brandOrange}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>By Category</span></div>
              {cats.map(([cat, st]) => (
                <div key={cat} style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'6px', background:`${catColors[cat]}20`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={getCategoryIcon(cat)} size={14} color={catColors[cat]}/></div>
                  <div style={{ flex:1 }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}><span style={{ fontSize:'13px', fontWeight:'500', color:colors.text }}>{cat}</span><span style={{ fontSize:'12px', color:colors.textMuted }}>{st.done}</span></div><div style={{ height:'4px', background:colors.bgMuted, borderRadius:'2px' }}><div style={{ height:'100%', background:catColors[cat], width:`${Math.min(100, st.done/(a.total||1)*100*3)}%`, borderRadius:'2px' }}/></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Setup Wizard with Smart Survey
const SetupWizard = ({ onComplete, onSkip }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ homeType: null, heating: null, cooling: null, waterHeater: null, features: [], equipment: [] });
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  
  const totalSteps = 7; // Welcome, HomeType, Heating, Cooling, WaterHeater, Features, Equipment, Review
  
  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleFeature = (id) => {
    setAnswers(prev => ({
      ...prev,
      features: prev.features.includes(id) 
        ? prev.features.filter(f => f !== id)
        : [...prev.features, id]
    }));
  };
  
  const toggleEquipment = (id) => {
    setAnswers(prev => ({
      ...prev,
      equipment: prev.equipment.includes(id) 
        ? prev.equipment.filter(e => e !== id)
        : [...prev.equipment, id]
    }));
  };
  
  const generateRecommendations = () => {
    const filtered = filterTasksForHome(answers);
    setRecommendedTasks(filtered);
    setSelectedTasks(new Set(filtered.map(t => t.title)));
  };
  
  const toggleTask = (title) => {
    const n = new Set(selectedTasks);
    n.has(title) ? n.delete(title) : n.add(title);
    setSelectedTasks(n);
  };
  
  const finish = () => {
    // Smart staggering: spread tasks out based on priority and category
    const now = new Date();
    
    // Priority order for initial scheduling
    const priorityOrder = {
      'Safety': 1,      // Safety first - within 2 weeks
      'HVAC': 2,        // HVAC next - within 1 month  
      'Plumbing': 3,    // Plumbing - within 6 weeks
      'Electrical': 4,  // Electrical - within 2 months
      'Kitchen': 5,     // Kitchen - within 2-3 months
      'Laundry': 6,     // Laundry - within 3 months
      'Exterior': 7,    // Exterior - spread across season
      'Seasonal': 8,    // Seasonal - based on actual season
      'Equipment': 9    // Equipment - spread out
    };
    
    // Group tasks by category
    const tasksByCategory = {};
    recommendedTasks
      .filter(t => selectedTasks.has(t.title))
      .forEach(t => {
        if (!tasksByCategory[t.category]) tasksByCategory[t.category] = [];
        tasksByCategory[t.category].push(t);
      });
    
    // Calculate staggered due dates
    const tasks = [];
    let dayOffset = 0;
    
    Object.entries(tasksByCategory)
      .sort((a, b) => (priorityOrder[a[0]] || 10) - (priorityOrder[b[0]] || 10))
      .forEach(([category, catTasks]) => {
        // Base delay for this category (in days)
        const baseDelay = {
          'Safety': 3,       // Start safety checks in 3 days
          'HVAC': 14,        // HVAC after 2 weeks
          'Plumbing': 21,    // Plumbing after 3 weeks
          'Electrical': 30,  // Electrical after 1 month
          'Kitchen': 45,     // Kitchen after 1.5 months
          'Laundry': 60,     // Laundry after 2 months
          'Exterior': 30,    // Exterior after 1 month
          'Seasonal': 14,    // Seasonal - check soon
          'Equipment': 45    // Equipment after 1.5 months
        }[category] || 30;
        
        // Spread tasks within category
        catTasks.forEach((t, idx) => {
          // Stagger within category: add 3-7 days between each task
          const staggerDays = baseDelay + (idx * Math.min(7, Math.floor(t.frequencyDays / 10)));
          
          // For seasonal tasks, consider actual timing
          let dueDate;
          if (category === 'Seasonal') {
            // Check if it's a seasonal task and set appropriate date
            const month = now.getMonth();
            const isWinter = month >= 10 || month <= 2;
            const isSummer = month >= 4 && month <= 8;
            
            if (t.title.toLowerCase().includes('winter') || t.title.toLowerCase().includes('snow')) {
              // Winter tasks - due in fall/early winter
              dueDate = isWinter ? new Date(now.getTime() + 7 * 86400000) : new Date(now.getFullYear(), 10, 1);
            } else if (t.title.toLowerCase().includes('spring') || t.title.toLowerCase().includes('sprinkler')) {
              // Spring tasks
              dueDate = new Date(now.getFullYear(), 3, 1);
              if (dueDate < now) dueDate.setFullYear(dueDate.getFullYear() + 1);
            } else if (t.title.toLowerCase().includes('summer') || t.title.toLowerCase().includes('ac ')) {
              // Summer tasks
              dueDate = isSummer ? new Date(now.getTime() + 14 * 86400000) : new Date(now.getFullYear(), 4, 1);
              if (dueDate < now) dueDate.setFullYear(dueDate.getFullYear() + 1);
            } else if (t.title.toLowerCase().includes('fall') || t.title.toLowerCase().includes('gutter')) {
              // Fall tasks
              dueDate = new Date(now.getFullYear(), 9, 1);
              if (dueDate < now) dueDate.setFullYear(dueDate.getFullYear() + 1);
            } else {
              dueDate = new Date(now.getTime() + staggerDays * 86400000);
            }
          } else {
            dueDate = new Date(now.getTime() + staggerDays * 86400000);
          }
          
          tasks.push({
            id: 't' + Date.now() + Math.random().toString(36).substr(2,9),
            title: t.title,
            category: t.category,
            frequencyDays: t.frequencyDays,
            notes: t.notes || '',
            lastDone: null,
            nextDue: dueDate,
            parts: [],
            completions: [],
            priority: category === 'Safety' // Mark safety tasks as priority
          });
        });
      });
    
    onComplete(tasks);
  };
  
  const nextStep = () => {
    if (step === 6) {
      generateRecommendations();
    }
    setStep(s => s + 1);
  };
  
  const OptionButton = ({ selected, onClick, icon, label, small }) => (
    <button onClick={onClick} style={{ 
      padding: small ? '12px' : '16px', 
      background: selected ? `${colors.brandOrange}15` : colors.bgCard, 
      border: selected ? `2px solid ${colors.brandOrange}` : `1.5px solid ${colors.border}`, 
      borderRadius: '12px', 
      cursor: 'pointer', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '8px',
      transition: 'all 0.15s ease'
    }}>
      <div style={{ 
        width: small ? '36px' : '48px', 
        height: small ? '36px' : '48px', 
        borderRadius: '12px', 
        background: selected ? colors.brandOrange : colors.bgMuted, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon name={icon} size={small ? 18 : 24} color={selected ? 'white' : colors.gray} />
      </div>
      <span style={{ fontSize: small ? '12px' : '14px', fontWeight: '500', color: selected ? colors.brandOrange : colors.text, textAlign: 'center' }}>{label}</span>
    </button>
  );
  
  const ProgressBar = () => (
    <div style={{ display: 'flex', gap: '6px', marginBottom: sp.lg }}>
      {[...Array(totalSteps)].map((_, i) => (
        <div key={i} style={{ 
          flex: 1, 
          height: '4px', 
          borderRadius: '2px', 
          background: i <= step ? colors.brandOrange : colors.bgMuted,
          transition: 'background 0.3s ease'
        }} />
      ))}
    </div>
  );
  
  return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, fontFamily: '-apple-system, sans-serif' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      
      {/* Step 0: Marketing Splash Screen */}
      {step === 0 && (
        <div style={{ 
          minHeight: '100vh', 
          position: 'relative',
          animation: 'fadeIn .4s ease'
        }}>
          <img 
            src="data:image/webp;base64,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" 
            alt="Protect your family's biggest investment" 
            style={{ 
              width: '100%', 
              height: '100vh', 
              objectFit: 'cover',
              objectPosition: 'top center'
            }} 
          />
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: '16px 24px', 
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.3))'
          }}>
            <button 
              onClick={nextStep} 
              style={{ 
                width: '100%', 
                padding: '18px', 
                background: 'white', 
                color: '#1a1a1a', 
                border: 'none', 
                borderRadius: '30px', 
                cursor: 'pointer', 
                fontWeight: '700', 
                fontSize: '18px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      {/* Step 1: Home Type */}
      {step === 1 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 1 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>What type of home?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>This helps us recommend the right tasks.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.md }}>
            {surveyOptions.homeType.map(opt => (
              <OptionButton key={opt.id} selected={answers.homeType === opt.id} onClick={() => setAnswer('homeType', opt.id)} icon={opt.icon} label={opt.label} />
            ))}
          </div>
          <button onClick={nextStep} disabled={!answers.homeType} style={{ width: '100%', marginTop: sp.xl, padding: '16px', background: answers.homeType ? colors.brandOrange : colors.bgMuted, color: answers.homeType ? 'white' : colors.grayLight, border: 'none', borderRadius: '12px', cursor: answers.homeType ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '16px' }}>Continue</button>
        </div>
      )}
      
      {/* Step 2: Heating */}
      {step === 2 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 2 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>Heating system?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>Different systems need different maintenance.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
            {surveyOptions.heating.map(opt => (
              <button key={opt.id} onClick={() => setAnswer('heating', opt.id)} style={{ 
                padding: '14px 16px', 
                background: answers.heating === opt.id ? `${colors.brandOrange}15` : colors.bgCard, 
                border: answers.heating === opt.id ? `2px solid ${colors.brandOrange}` : `1.5px solid ${colors.border}`, 
                borderRadius: '12px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: sp.md,
                textAlign: 'left'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: answers.heating === opt.id ? colors.brandOrange : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={opt.icon} size={20} color={answers.heating === opt.id ? 'white' : colors.gray} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: answers.heating === opt.id ? colors.brandOrange : colors.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={nextStep} disabled={!answers.heating} style={{ width: '100%', marginTop: sp.xl, padding: '16px', background: answers.heating ? colors.brandOrange : colors.bgMuted, color: answers.heating ? 'white' : colors.grayLight, border: 'none', borderRadius: '12px', cursor: answers.heating ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '16px' }}>Continue</button>
        </div>
      )}
      
      {/* Step 3: Cooling */}
      {step === 3 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 3 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>Cooling system?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>Select your primary cooling method.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
            {surveyOptions.cooling.map(opt => (
              <button key={opt.id} onClick={() => setAnswer('cooling', opt.id)} style={{ 
                padding: '14px 16px', 
                background: answers.cooling === opt.id ? `${colors.brandOrange}15` : colors.bgCard, 
                border: answers.cooling === opt.id ? `2px solid ${colors.brandOrange}` : `1.5px solid ${colors.border}`, 
                borderRadius: '12px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: sp.md,
                textAlign: 'left'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: answers.cooling === opt.id ? colors.brandOrange : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={opt.icon} size={20} color={answers.cooling === opt.id ? 'white' : colors.gray} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: answers.cooling === opt.id ? colors.brandOrange : colors.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={nextStep} disabled={!answers.cooling} style={{ width: '100%', marginTop: sp.xl, padding: '16px', background: answers.cooling ? colors.brandOrange : colors.bgMuted, color: answers.cooling ? 'white' : colors.grayLight, border: 'none', borderRadius: '12px', cursor: answers.cooling ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '16px' }}>Continue</button>
        </div>
      )}
      
      {/* Step 4: Water Heater */}
      {step === 4 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 4 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>Water heater type?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>Tank heaters need regular flushing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp.sm }}>
            {surveyOptions.waterHeater.map(opt => (
              <OptionButton key={opt.id} selected={answers.waterHeater === opt.id} onClick={() => setAnswer('waterHeater', opt.id)} icon={opt.icon} label={opt.label} small />
            ))}
          </div>
          <button onClick={nextStep} disabled={!answers.waterHeater} style={{ width: '100%', marginTop: sp.xl, padding: '16px', background: answers.waterHeater ? colors.brandOrange : colors.bgMuted, color: answers.waterHeater ? 'white' : colors.grayLight, border: 'none', borderRadius: '12px', cursor: answers.waterHeater ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '16px' }}>Continue</button>
        </div>
      )}
      
      {/* Step 5: Features */}
      {step === 5 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease', paddingBottom: '100px' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 5 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>Home features?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>Select all that apply.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.sm }}>
            {surveyOptions.features.map(opt => (
              <button key={opt.id} onClick={() => toggleFeature(opt.id)} style={{ 
                padding: '12px', 
                background: answers.features.includes(opt.id) ? `${colors.brandOrange}15` : colors.bgCard, 
                border: answers.features.includes(opt.id) ? `2px solid ${colors.brandOrange}` : `1.5px solid ${colors.border}`, 
                borderRadius: '10px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: sp.sm,
                textAlign: 'left'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: answers.features.includes(opt.id) ? colors.brandOrange : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {answers.features.includes(opt.id) && <Icon name="check" size={14} color="white" />}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: answers.features.includes(opt.id) ? colors.brandOrange : colors.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.bgPrimary, padding: sp.lg, borderTop: `1px solid ${colors.border}` }}>
            <button onClick={nextStep} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'block', padding: '16px', background: colors.brandOrange, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }}>Continue</button>
          </div>
        </div>
      )}
      
      {/* Step 6: Equipment */}
      {step === 6 && (
        <div style={{ padding: sp.lg, maxWidth: '400px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease', paddingBottom: '100px' }}>
          <ProgressBar />
          <p style={{ fontSize: '13px', color: colors.brandOrange, fontWeight: '600', marginBottom: sp.xs }}>STEP 6 OF 6</p>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: sp.sm }}>Outdoor equipment?</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: sp.lg }}>We'll remind you about maintenance.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.sm }}>
            {surveyOptions.equipment.map(opt => (
              <button key={opt.id} onClick={() => toggleEquipment(opt.id)} style={{ 
                padding: '12px', 
                background: answers.equipment.includes(opt.id) ? `${colors.brandOrange}15` : colors.bgCard, 
                border: answers.equipment.includes(opt.id) ? `2px solid ${colors.brandOrange}` : `1.5px solid ${colors.border}`, 
                borderRadius: '10px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: sp.sm,
                textAlign: 'left'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: answers.equipment.includes(opt.id) ? colors.brandOrange : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {answers.equipment.includes(opt.id) && <Icon name="check" size={14} color="white" />}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: answers.equipment.includes(opt.id) ? colors.brandOrange : colors.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.bgPrimary, padding: sp.lg, borderTop: `1px solid ${colors.border}` }}>
            <button onClick={nextStep} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'block', padding: '16px', background: colors.brandOrange, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }}>See My Tasks</button>
          </div>
        </div>
      )}
      
      {/* Step 7: Review Recommended Tasks */}
      {step === 7 && (
        <div style={{ padding: sp.lg, maxWidth: '500px', margin: '0 auto', paddingTop: sp.xl, animation: 'fadeIn .4s ease', paddingBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: sp.lg }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: colors.successBg, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="checkCircle" size={30} color={colors.success} />
            </div>
            <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: '700', marginBottom: sp.xs }}>Your Personalized Plan</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px' }}>We found <strong style={{ color: colors.brandOrange }}>{recommendedTasks.length} tasks</strong> for your home. Uncheck any you don't need.</p>
          </div>
          
          {categories.map(cat => {
            const catTasks = recommendedTasks.filter(t => t.category === cat);
            if (!catTasks.length) return null;
            return (
              <div key={cat} style={{ marginBottom: sp.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, marginBottom: sp.sm }}>
                  <Icon name={getCategoryIcon(cat)} size={14} color={catColors[cat]} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: colors.slate }}>{cat}</span>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>({catTasks.length})</span>
                </div>
                {catTasks.map(t => (
                  <div key={t.title} onClick={() => toggleTask(t.title)} style={{ 
                    background: colors.bgCard, 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: sp.xs, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: sp.md, 
                    cursor: 'pointer', 
                    border: selectedTasks.has(t.title) ? `2px solid ${colors.brandOrange}` : `1px solid ${colors.border}`,
                    opacity: selectedTasks.has(t.title) ? 1 : 0.6
                  }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: selectedTasks.has(t.title) ? colors.brandOrange : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedTasks.has(t.title) && <Icon name="check" size={14} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: colors.text, display: 'block' }}>{t.title}</span>
                      <span style={{ fontSize: '12px', color: colors.textMuted }}>{frequencyOptions.find(f => f.days === t.frequencyDays)?.label || `Every ${t.frequencyDays} days`}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.bgPrimary, padding: sp.lg, borderTop: `1px solid ${colors.border}` }}>
            <button onClick={finish} disabled={selectedTasks.size === 0} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'block', padding: '16px', background: selectedTasks.size > 0 ? colors.brandOrange : colors.bgMuted, color: selectedTasks.size > 0 ? 'white' : colors.grayLight, border: 'none', borderRadius: '12px', cursor: selectedTasks.size > 0 ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '16px' }}>
              Start with {selectedTasks.size} Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Task Components
const TaskCard = ({ task, onDone, onView, isCompleting, index = 0 }) => {
  const { colors } = useTheme();
  const d = getDaysUntilDue(task.nextDue);
  const { text, isOverdue } = formatDueText(d);
  const [isPressed, setIsPressed] = useState(false);
  
  // Calculate progress to next due (visual indicator)
  const daysSinceLastDone = task.lastDone ? Math.floor((Date.now() - new Date(task.lastDone).getTime()) / 86400000) : 0;
  const progress = Math.min(100, Math.max(0, (daysSinceLastDone / task.frequencyDays) * 100));
  
  return (
    <div 
      className="task-card"
      onClick={() => !isCompleting && onView(task)} 
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role="button"
      tabIndex={0}
      aria-label={`${task.title}, ${text}, ${task.category} category`}
      onKeyDown={e => { if (e.key === 'Enter' && !isCompleting) onView(task); }}
      style={{ 
        background: isCompleting ? `${colors.brandOrange}10` : colors.bgCard, 
        borderRadius: '12px', 
        padding: sp.md, 
        marginBottom: sp.sm, 
        display: 'flex', 
        alignItems: 'center', 
        cursor: isCompleting ? 'default' : 'pointer', 
        border: `1px solid ${isCompleting ? colors.brandOrange : isOverdue ? colors.urgent + '40' : colors.border}`,
        opacity: isCompleting ? 0.7 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isCompleting ? 'scale(0.98)' : isPressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: isCompleting ? `0 0 0 2px ${colors.brandOrange}40` : isOverdue ? `0 0 0 1px ${colors.urgent}20` : '0 1px 3px rgba(0,0,0,0.04)',
        animation: `slideIn 0.3s ease both`,
        animationDelay: `${index * 0.03}s`
      }}
    >
      {/* Category Icon with Progress Ring */}
      <div style={{ position: 'relative', marginRight: sp.md }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '10px', 
          background: isCompleting ? `${colors.brandOrange}20` : `${catColors[task.category]}12`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transition: 'all 0.3s ease' 
        }}>
          <Icon name={getCategoryIcon(task.category)} size={20} color={isCompleting ? colors.brandOrange : catColors[task.category]}/>
        </div>
        {/* Mini progress indicator */}
        {!isCompleting && d <= 7 && d >= 0 && (
          <div style={{ 
            position: 'absolute', 
            bottom: '-2px', 
            right: '-2px', 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: d <= 3 ? colors.urgent : colors.brandOrange,
            border: `2px solid ${colors.bgCard}`,
            animation: d < 0 ? 'pulse 1.5s infinite' : 'none'
          }}/>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontSize: '15px', 
          fontWeight: '600', 
          color: isCompleting ? colors.brandOrange : colors.text, 
          marginBottom: '3px', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          textDecoration: isCompleting ? 'line-through' : 'none', 
          transition: 'all 0.3s ease' 
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '13px', 
            color: isCompleting ? colors.brandOrange : (isOverdue ? colors.urgent : colors.textMuted), 
            fontWeight: isOverdue ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isCompleting ? (
              <><Icon name="check" size={12} color={colors.brandOrange}/> Completed!</>
            ) : (
              <>{isOverdue && <Icon name="alertCircle" size={12} color={colors.urgent}/>}{text}</>
            )}
          </span>
          {/* Frequency badge */}
          {!isCompleting && (
            <span style={{ 
              fontSize: '11px', 
              color: colors.grayLight, 
              background: colors.bgMuted, 
              padding: '2px 6px', 
              borderRadius: '4px' 
            }}>
              {task.frequencyDays < 30 ? `${task.frequencyDays}d` : task.frequencyDays < 365 ? `${Math.round(task.frequencyDays/30)}mo` : '1yr'}
            </span>
          )}
        </div>
      </div>
      
      {/* Complete button with better feedback */}
      <button 
        onClick={e => { e.stopPropagation(); if (!isCompleting) onDone(task.id); }} 
        className="btn-press"
        aria-label={`Mark ${task.title} as complete`}
        style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '10px', 
          border: isCompleting ? 'none' : `2px solid ${isOverdue ? colors.urgent : colors.border}`, 
          background: isCompleting ? colors.brandOrange : 'transparent', 
          cursor: isCompleting ? 'default' : 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginLeft: sp.sm, 
          flexShrink: 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isCompleting ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isCompleting ? '0 4px 12px rgba(248, 90, 0, 0.4)' : 'none'
        }}
      >
        <Icon name="check" size={18} color={isCompleting ? 'white' : (isOverdue ? colors.urgent : colors.grayLight)}/>
      </button>
    </div>
  );
};

const TaskSection = ({ title, tasks, onDone, onView, urgent, open: defaultOpen = true, completingId }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  if (!tasks.length) return null;
  return (
    <div style={{ marginBottom: sp.lg }}>
      <button 
        onClick={() => setOpen(!open)} 
        aria-expanded={open}
        aria-label={`${title} section, ${tasks.length} tasks`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          padding: `${sp.sm} 0`, 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          textAlign: 'left' 
        }}
      >
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '700', 
          color: urgent ? colors.urgent : colors.textMuted, 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px', 
          flex: 1 
        }}>{title}</span>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: urgent ? 'white' : colors.textMuted, 
          background: urgent ? colors.urgent : colors.bgMuted, 
          padding: '3px 10px', 
          borderRadius: '12px', 
          marginRight: sp.sm 
        }}>{tasks.length}</span>
        <div style={{ 
          transform: open ? 'rotate(90deg)' : 'rotate(0)', 
          transition: 'transform .2s ease', 
          color: colors.grayLight 
        }}>
          <Icon name="chevronRight" size={14}/>
        </div>
      </button>
      {open && (
        <div style={{ paddingTop: sp.xs }}>
          {tasks.map((t, i) => (
            <TaskCard 
              key={t.id} 
              task={t} 
              onDone={onDone} 
              onView={onView} 
              isCompleting={completingId === t.id}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Category Section for category view mode
const CategorySection = ({ category, tasks, onDone, onView, defaultOpen = false, completingId }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  if (!tasks.length) return null;
  
  // Calculate different due states
  const overdueCount = tasks.filter(t => getDaysUntilDue(t.nextDue) < 0).length;
  const dueSoonCount = tasks.filter(t => { const d = getDaysUntilDue(t.nextDue); return d >= 0 && d <= 7; }).length;
  const laterCount = tasks.filter(t => { const d = getDaysUntilDue(t.nextDue); return d > 7; }).length;
  
  // Build status text
  const getStatusText = () => {
    const parts = [];
    if (overdueCount > 0) parts.push(`${overdueCount} Overdue`);
    if (dueSoonCount > 0) parts.push(`${dueSoonCount} Due Soon`);
    if (laterCount > 0 && parts.length === 0) parts.push(`${laterCount} Upcoming`);
    return parts.length > 0 ? parts.join(' · ') : 'All caught up!';
  };
  
  // Determine urgency level for styling
  const hasUrgent = overdueCount > 0;
  const hasDueSoon = dueSoonCount > 0;
  
  return (
    <div style={{ marginBottom:sp.md, background:colors.bgCard, borderRadius:'12px', border:`1px solid ${hasUrgent ? colors.urgent + '40' : colors.border}`, overflow:'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ display:'flex', alignItems:'center', width:'100%', padding:sp.md, background:'none', border:'none', cursor:'pointer', textAlign:'left', borderLeft:`4px solid ${catColors[category]}` }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${catColors[category]}15`, display:'flex', alignItems:'center', justifyContent:'center', marginRight:sp.md }}>
          <Icon name={getCategoryIcon(category)} size={18} color={catColors[category]}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:sp.sm }}>
            <span style={{ fontSize:'15px', fontWeight:'600', color:colors.text }}>{category}</span>
            <span style={{ fontSize:'12px', color:colors.textMuted, background:colors.bgMuted, padding:'2px 8px', borderRadius:'10px' }}>{tasks.length}</span>
          </div>
          <div style={{ fontSize:'12px', marginTop:'3px', display:'flex', alignItems:'center', gap:sp.xs }}>
            {overdueCount > 0 && (
              <span style={{ color:colors.urgent, fontWeight:'600', display:'flex', alignItems:'center', gap:'3px' }}>
                <Icon name="alertCircle" size={10} color={colors.urgent}/>{overdueCount} Overdue
              </span>
            )}
            {overdueCount > 0 && dueSoonCount > 0 && <span style={{ color:colors.textMuted }}>·</span>}
            {dueSoonCount > 0 && (
              <span style={{ color:colors.brandOrange, fontWeight:'500' }}>{dueSoonCount} Due Soon</span>
            )}
            {overdueCount === 0 && dueSoonCount === 0 && (
              <span style={{ color:colors.success, fontWeight:'500' }}>✓ All caught up</span>
            )}
          </div>
        </div>
        <div style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition:'transform .2s', color:colors.grayLight }}><Icon name="chevronRight" size={18}/></div>
      </button>
      {open && (
        <div style={{ borderTop:`1px solid ${colors.border}` }}>
          {/* Show tasks grouped by urgency within category */}
          {overdueCount > 0 && (
            <div style={{ padding:`${sp.sm} ${sp.md}`, background:colors.urgentBg }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:colors.urgent, textTransform:'uppercase', marginBottom:sp.xs }}>Overdue</div>
              {tasks.filter(t => getDaysUntilDue(t.nextDue) < 0).map(t => <TaskCard key={t.id} task={t} onDone={onDone} onView={onView} isCompleting={completingId === t.id}/>)}
            </div>
          )}
          {dueSoonCount > 0 && (
            <div style={{ padding:`${sp.sm} ${sp.md}`, background: overdueCount > 0 ? colors.bgPrimary : 'transparent' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:colors.brandOrange, textTransform:'uppercase', marginBottom:sp.xs }}>Due Soon</div>
              {tasks.filter(t => { const d = getDaysUntilDue(t.nextDue); return d >= 0 && d <= 7; }).map(t => <TaskCard key={t.id} task={t} onDone={onDone} onView={onView} isCompleting={completingId === t.id}/>)}
            </div>
          )}
          {laterCount > 0 && (
            <div style={{ padding:`${sp.sm} ${sp.md}` }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase', marginBottom:sp.xs }}>Later</div>
              {tasks.filter(t => getDaysUntilDue(t.nextDue) > 7).map(t => <TaskCard key={t.id} task={t} onDone={onDone} onView={onView} isCompleting={completingId === t.id}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Critical Tasks Section - always visible at top
const CriticalSection = ({ tasks, onDone, onView, completingId }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);
  if (!tasks.length) return null;
  return (
    <div style={{ marginBottom:sp.lg, background:`${colors.urgent}08`, borderRadius:'12px', border:`1px solid ${colors.urgent}30`, overflow:'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ display:'flex', alignItems:'center', width:'100%', padding:sp.md, background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:colors.urgentBg, display:'flex', alignItems:'center', justifyContent:'center', marginRight:sp.md }}>
          <Icon name="alertCircle" size={16} color={colors.urgent}/>
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:'14px', fontWeight:'700', color:colors.urgent, textTransform:'uppercase', letterSpacing:'0.5px' }}>Critical</span>
          <div style={{ fontSize:'12px', color:colors.textMuted, marginTop:'2px' }}>Needs immediate attention</div>
        </div>
        <span style={{ fontSize:'12px', fontWeight:'700', color:'white', background:colors.urgent, padding:'4px 10px', borderRadius:'12px', marginRight:sp.sm }}>{tasks.length}</span>
        <div style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition:'transform .2s', color:colors.urgent }}><Icon name="chevronRight" size={16}/></div>
      </button>
      {open && <div style={{ padding:`0 ${sp.md} ${sp.md}` }}>{tasks.map(t => <TaskCard key={t.id} task={t} onDone={onDone} onView={onView} isCompleting={completingId === t.id}/>)}</div>}
    </div>
  );
};

// Add Action Sheet - shown when + button is tapped
const AddActionSheet = ({ onClose, onBrowseTemplates, onCreateCustom }) => {
  const { colors } = useTheme();
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:colors.bgCard, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'500px', padding:sp.lg, animation:'slideUp .3s ease' }}>
        <div style={{ width:'36px', height:'4px', background:colors.bgMuted, borderRadius:'2px', margin:'0 auto 20px' }}/>
        <h3 style={{ margin:`0 0 ${sp.md}`, fontSize:'18px', fontWeight:'600', color:colors.text, textAlign:'center' }}>Add Task</h3>
        <button onClick={onBrowseTemplates} style={{ width:'100%', padding:'16px', background:colors.brandOrange, color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'600', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.sm }}>
          <Icon name="sparkles" size={20} color="white"/> Browse Templates
        </button>
        <p style={{ textAlign:'center', fontSize:'12px', color:colors.textMuted, margin:`0 0 ${sp.sm}` }}>Choose from 80+ pre-made maintenance tasks</p>
        <button onClick={onCreateCustom} style={{ width:'100%', padding:'16px', background:colors.bgMuted, color:colors.text, border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'600', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.md }}>
          <Icon name="edit" size={20} color={colors.text}/> Create Custom Task
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'14px', background:'transparent', color:colors.textMuted, border:'none', cursor:'pointer', fontWeight:'500', fontSize:'14px' }}>Cancel</button>
      </div>
    </div>
  );
};

// Modals
const Modal = ({ children, onClose }) => {
  const { colors } = useTheme();
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:colors.bgPrimary, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflow:'auto', animation:'slideUp .3s ease' }}>{children}</div>
    </div>
  );
};

const ModalHeader = ({ title, onClose }) => {
  const { colors } = useTheme();
  return (
    <div style={{ padding:sp.lg, borderBottom:`1px solid ${colors.border}`, background:colors.bgCard, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
      <h3 style={{ margin:0, fontSize:'18px', fontWeight:'600', color:colors.text }}>{title}</h3>
      <button onClick={onClose} style={{ background:colors.bgMuted, border:'none', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:colors.gray }}><Icon name="x" size={18}/></button>
    </div>
  );
};

const AddTaskModal = ({ onClose, onAdd, template }) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState(template?.title || '');
  const [cat, setCat] = useState(template?.category || 'HVAC');
  const [freq, setFreq] = useState(template?.frequencyDays || 90);
  const [notes, setNotes] = useState(template?.notes || '');
  const [due, setDue] = useState('now');
  const inp = { width:'100%', padding:'12px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'15px', background:colors.bgCard, color:colors.text, outline:'none', boxSizing:'border-box' };
  const save = () => { if (!title.trim()) return; onAdd({ id:'t'+Date.now(), title:title.trim(), category:cat, frequencyDays:freq, notes:notes.trim(), lastDone: due==='now' ? null : new Date(), nextDue: due==='now' ? new Date() : new Date(Date.now()+freq*86400000), parts:[], completions:[] }); onClose(); };
  return <Modal onClose={onClose}><ModalHeader title={template ? 'Add Template' : 'New Task'} onClose={onClose}/><div style={{ padding:sp.lg }}>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Task Name *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Replace HVAC Filter" style={inp} autoFocus/></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Category</label><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:sp.sm }}>{categories.map(c => <button key={c} onClick={() => setCat(c)} style={{ padding:'8px', borderRadius:'8px', border: cat===c ? `2px solid ${catColors[c]}` : `1px solid ${colors.border}`, background: cat===c ? `${catColors[c]}15` : colors.bgCard, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}><Icon name={getCategoryIcon(c)} size={16} color={cat===c ? catColors[c] : colors.gray}/><span style={{ fontSize:'9px', fontWeight:'500', color: cat===c ? catColors[c] : colors.textMuted }}>{c}</span></button>)}</div></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Frequency</label><select value={freq} onChange={e => setFreq(+e.target.value)} style={{ ...inp, cursor:'pointer' }}>{frequencyOptions.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}</select></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Due</label><div style={{ display:'flex', gap:sp.sm }}>{[{k:'now',l:'Due Now'},{k:'done',l:'Just Done'}].map(o => <button key={o.k} onClick={() => setDue(o.k)} style={{ flex:1, padding:'10px', borderRadius:'8px', border: due===o.k ? `2px solid ${colors.brandBlue}` : `1px solid ${colors.border}`, background: due===o.k ? `${colors.brandBlue}15` : colors.bgCard, cursor:'pointer', fontWeight:'500', fontSize:'13px', color: due===o.k ? colors.brandBlue : colors.textMuted }}>{o.l}</button>)}</div></div>
    <div style={{ marginBottom:sp.lg }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize:'vertical', fontFamily:'inherit' }}/></div>
    <button onClick={save} disabled={!title.trim()} style={{ width:'100%', padding:'14px', background: title.trim() ? colors.brandOrange : colors.bgMuted, color: title.trim() ? 'white' : colors.grayLight, border:'none', borderRadius:'12px', cursor: title.trim() ? 'pointer' : 'not-allowed', fontWeight:'600', fontSize:'15px' }}>Add Task</button>
  </div></Modal>;
};

const EditTaskModal = ({ task, onClose, onSave }) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState(task.title);
  const [cat, setCat] = useState(task.category);
  const [freq, setFreq] = useState(task.frequencyDays);
  const [notes, setNotes] = useState(task.notes || '');
  const inp = { width:'100%', padding:'12px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'15px', background:colors.bgCard, color:colors.text, outline:'none', boxSizing:'border-box' };
  const save = () => { if (title.trim()) { onSave({ ...task, title:title.trim(), category:cat, frequencyDays:freq, notes:notes.trim() }); onClose(); } };
  return <Modal onClose={onClose}><ModalHeader title="Edit Task" onClose={onClose}/><div style={{ padding:sp.lg }}>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Task Name *</label><input value={title} onChange={e => setTitle(e.target.value)} style={inp}/></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Category</label><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:sp.sm }}>{categories.map(c => <button key={c} onClick={() => setCat(c)} style={{ padding:'8px', borderRadius:'8px', border: cat===c ? `2px solid ${catColors[c]}` : `1px solid ${colors.border}`, background: cat===c ? `${catColors[c]}15` : colors.bgCard, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}><Icon name={getCategoryIcon(c)} size={16} color={cat===c ? catColors[c] : colors.gray}/><span style={{ fontSize:'9px', fontWeight:'500', color: cat===c ? catColors[c] : colors.textMuted }}>{c}</span></button>)}</div></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Frequency</label><select value={freq} onChange={e => setFreq(+e.target.value)} style={{ ...inp, cursor:'pointer' }}>{frequencyOptions.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}</select></div>
    <div style={{ marginBottom:sp.lg }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'14px' }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize:'vertical', fontFamily:'inherit' }}/></div>
    <button onClick={save} disabled={!title.trim()} style={{ width:'100%', padding:'14px', background: title.trim() ? colors.brandOrange : colors.bgMuted, color: title.trim() ? 'white' : colors.grayLight, border:'none', borderRadius:'12px', cursor: title.trim() ? 'pointer' : 'not-allowed', fontWeight:'600', fontSize:'15px' }}>Save Changes</button>
  </div></Modal>;
};

const TemplatesModal = ({ onClose, onSelect, existing, onQuickAdd }) => {
  const { colors } = useTheme();
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const titles = new Set(existing.map(t => t.title));
  const list = taskTemplates
    .filter(t => cat === 'All' || t.category === cat)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));
  const availableCount = list.filter(t => !titles.has(t.title)).length;
  
  const quickAdd = (template) => {
    const task = {
      id: 't' + Date.now() + Math.random().toString(36).substr(2,9),
      title: template.title,
      category: template.category,
      frequencyDays: template.frequencyDays,
      notes: template.notes || '',
      lastDone: null,
      nextDue: new Date(),
      parts: [],
      completions: [],
      priority: template.priority || false
    };
    if (onQuickAdd) onQuickAdd(task);
  };
  
  return <Modal onClose={onClose}>
    <ModalHeader title="Add from Templates" onClose={onClose}/>
    <div style={{ padding:`${sp.sm} ${sp.lg}`, borderBottom:`1px solid ${colors.border}`, background:colors.bgCard }}>
      <div style={{ position:'relative', marginBottom:sp.sm }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." style={{ width:'100%', padding:'10px 12px 10px 36px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'14px', background:colors.bgPrimary, color:colors.text, outline:'none', boxSizing:'border-box' }}/>
        <div style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color={colors.grayLight}/></div>
      </div>
      <div style={{ display:'flex', gap:sp.xs, overflowX:'auto', paddingBottom:sp.xs }}>
        {['All',...categories].map(c => <button key={c} onClick={() => setCat(c)} style={{ padding:'6px 12px', borderRadius:'20px', border:'none', cursor:'pointer', background: cat===c ? colors.brandOrange : colors.bgMuted, color: cat===c ? 'white' : colors.textMuted, fontWeight:'500', fontSize:'12px', whiteSpace:'nowrap' }}>{c}</button>)}
      </div>
      <div style={{ fontSize:'12px', color:colors.textMuted, marginTop:sp.xs }}>{availableCount} templates available · {titles.size} already added</div>
    </div>
    <div style={{ padding:sp.lg, maxHeight:'60vh', overflow:'auto' }}>
      {list.length === 0 ? (
        <div style={{ textAlign:'center', padding:sp.xl, color:colors.textMuted }}>
          <Icon name="search" size={24} color={colors.grayLight}/>
          <p style={{ marginTop:sp.sm }}>No templates found</p>
        </div>
      ) : (
        list.map((t,i) => { 
          const added = titles.has(t.title); 
          return (
            <div key={i} style={{ background:colors.bgCard, borderRadius:'10px', padding:sp.md, marginBottom:sp.sm, borderLeft:`3px solid ${catColors[t.category]}`, opacity: added ? 0.5 : 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:colors.text, marginBottom:'2px' }}>
                    {t.title}
                    {added && <span style={{ fontSize:'11px', color:colors.success, marginLeft:sp.sm, fontWeight:'500' }}>✓ Added</span>}
                  </div>
                  <div style={{ fontSize:'12px', color:colors.textMuted }}>{frequencyOptions.find(f => f.days === t.frequencyDays)?.label} · {t.category}</div>
                </div>
                {!added && (
                  <div style={{ display:'flex', gap:sp.xs }}>
                    <button onClick={() => quickAdd(t)} style={{ padding:'6px 12px', background:colors.success, color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px' }}>+ Add</button>
                    <button onClick={() => onSelect(t)} style={{ padding:'6px 10px', background:colors.bgMuted, color:colors.textMuted, border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' }}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </Modal>;
};

const SettingsModal = ({ onClose, settings, onSave, onClear, tasks, onAnalytics, onImport }) => {
  const { colors, isDark, toggle } = useTheme();
  const [time, setTime] = useState(settings.reminderTime);
  const [confirm, setConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileRef = useRef(null);
  const inp = { padding:'12px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'15px', background:colors.bgCard, color:colors.text, outline:'none' };
  const exportData = () => { const d = JSON.stringify({ version:'1.4', tasks: tasks.map(t => ({ ...t, lastDone: t.lastDone?.toISOString(), nextDue: t.nextDue?.toISOString() })) }, null, 2); const b = new Blob([d], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `homekeep-${new Date().toISOString().split('T')[0]}.json`; a.click(); };
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.tasks && Array.isArray(data.tasks)) {
          const imported = data.tasks.map(t => ({ ...t, lastDone: t.lastDone ? new Date(t.lastDone) : null, nextDue: t.nextDue ? new Date(t.nextDue) : new Date(), completions: t.completions || [], parts: t.parts || [] }));
          onImport(imported);
          setImportStatus({ success: true, count: imported.length });
        } else { setImportStatus({ success: false, error: 'Invalid file format' }); }
      } catch (err) { setImportStatus({ success: false, error: 'Could not read file' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  return <Modal onClose={onClose}><ModalHeader title="Settings" onClose={onClose}/><div style={{ padding:sp.lg }}>
    <button onClick={() => { onClose(); setTimeout(onAnalytics, 100); }} style={{ width:'100%', padding:sp.md, background:`linear-gradient(135deg, ${colors.brandOrange}, ${colors.brandBlue})`, borderRadius:'12px', border:'none', cursor:'pointer', marginBottom:sp.md, display:'flex', alignItems:'center', gap:sp.md }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="barChart" size={20} color="white"/></div>
      <div style={{ textAlign:'left', flex:1 }}><div style={{ fontSize:'15px', fontWeight:'600', color:'white' }}>View Analytics</div><div style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>Track your progress</div></div>
      <Icon name="chevronRight" size={18} color="white"/>
    </button>
    <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm }}><Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Dark Mode</span></div>
      <button onClick={toggle} style={{ width:'50px', height:'28px', borderRadius:'14px', border:'none', cursor:'pointer', background: isDark ? colors.brandOrange : colors.bgMuted, position:'relative' }}><div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: isDark ? '25px' : '3px', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/></button>
    </div>
    <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="clock" size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Reminder Time</span></div>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inp, width:'130px' }}/>
    </div>
    <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="info" size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Data</span></div>
      <p style={{ fontSize:'13px', color:colors.textMuted, margin:`0 0 ${sp.md}` }}>{tasks.length} tasks</p>
      <div style={{ display:'flex', gap:sp.sm, flexWrap:'wrap' }}>
        <button onClick={exportData} disabled={!tasks.length} style={{ padding:'10px 14px', background: tasks.length ? colors.brandBlue : colors.bgMuted, color: tasks.length ? 'white' : colors.grayLight, border:'none', borderRadius:'8px', cursor: tasks.length ? 'pointer' : 'not-allowed', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="download" size={14} color={tasks.length ? 'white' : colors.grayLight}/> Export</button>
        <input type="file" accept=".json" ref={fileRef} onChange={handleImport} style={{ display:'none' }}/>
        <button onClick={() => fileRef.current?.click()} style={{ padding:'10px 14px', background:colors.bgMuted, color:colors.text, border:`1px solid ${colors.border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="upload" size={14} color={colors.text}/> Import</button>
      </div>
      {importStatus && <div style={{ marginTop:sp.sm, padding:sp.sm, borderRadius:'6px', background: importStatus.success ? colors.successBg : colors.urgentBg, display:'flex', alignItems:'center', gap:sp.sm }}><Icon name={importStatus.success ? 'checkCircle' : 'alertCircle'} size={14} color={importStatus.success ? colors.success : colors.urgent}/><span style={{ fontSize:'12px', color: importStatus.success ? colors.success : colors.urgent }}>{importStatus.success ? `Imported ${importStatus.count} tasks` : importStatus.error}</span></div>}
    </div>
    <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="smartphone" size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Install App</span></div>
      <p style={{ fontSize:'12px', color:colors.textMuted, margin:`0 0 ${sp.sm}`, lineHeight:'1.4' }}>Add HomeKeep to your home screen for quick access and offline use.</p>
      <div style={{ fontSize:'12px', color:colors.textMuted, background:colors.bgMuted, padding:sp.sm, borderRadius:'6px' }}>
        <div style={{ marginBottom:'4px' }}><strong style={{ color:colors.text }}>iOS:</strong> Tap <Icon name="share" size={12} color={colors.brandBlue}/> then "Add to Home Screen"</div>
        <div><strong style={{ color:colors.text }}>Android:</strong> Tap menu then "Install app"</div>
      </div>
    </div>
    <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.urgent}30`, marginBottom:sp.lg }}>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="trash" size={18} color={colors.urgent}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.urgent }}>Clear Data</span></div>
      {!confirm ? <button onClick={() => setConfirm(true)} style={{ padding:'10px 14px', background:'transparent', color:colors.urgent, border:`1px solid ${colors.urgent}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Delete All</button> : <div><p style={{ fontSize:'13px', color:colors.urgent, marginBottom:sp.sm }}>Are you sure?</p><div style={{ display:'flex', gap:sp.sm }}><button onClick={() => setConfirm(false)} style={{ padding:'10px 14px', background:colors.bgMuted, color:colors.text, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Cancel</button><button onClick={() => { onClear(); onClose(); }} style={{ padding:'10px 14px', background:colors.urgent, color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>Delete</button></div></div>}
    </div>
    <button onClick={() => { onSave({ ...settings, reminderTime: time }); onClose(); }} style={{ width:'100%', padding:'14px', background:colors.brandOrange, color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'600', fontSize:'15px' }}>Save</button>
    <p style={{ textAlign:'center', fontSize:'11px', color:colors.grayLight, marginTop:sp.lg }}>HomeKeep v2.0</p>
  </div></Modal>;
};

const AddPartModal = ({ onClose, onAdd }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [qty, setQty] = useState('1');
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef(null);
  const inp = { width:'100%', padding:'12px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'15px', background:colors.bgCard, color:colors.text, outline:'none', boxSizing:'border-box' };
  const scan = () => { setScanning(true); setTimeout(() => { const r = [{name:'Air Filter',spec:'20x25x1 MERV 13'},{name:'Water Filter',spec:'GE RPWFE'}][Math.floor(Math.random()*2)]; setName(r.name); setSpec(r.spec); setScanning(false); }, 1500); };
  const save = () => { if (name.trim()) { onAdd({ id:'p'+Date.now(), name:name.trim(), spec:spec.trim(), qty:+qty||1 }); onClose(); } };
  return <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:sp.lg }}><div onClick={e => e.stopPropagation()} style={{ background:colors.bgCard, borderRadius:'16px', width:'100%', maxWidth:'400px' }}><ModalHeader title="Add Part" onClose={onClose}/><div style={{ padding:sp.lg }}>
    {scanning ? <div style={{ textAlign:'center', padding:sp.xl }}><div style={{ width:'60px', height:'60px', borderRadius:'50%', background:colors.bgMuted, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="scan" size={24} color={colors.brandOrange}/></div><p style={{ color:colors.text }}>Scanning...</p></div> : <>
    <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={() => scan()} style={{ display:'none' }}/>
    {!name && <><button onClick={() => fileRef.current?.click()} style={{ width:'100%', padding:'14px', background:colors.brandOrange, color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.lg }}><Icon name="scan" size={18} color="white"/> Scan Label</button><div style={{ textAlign:'center', color:colors.textMuted, marginBottom:sp.md, fontSize:'13px' }}>or enter manually</div></>}
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'13px' }}>Part Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., HVAC Filter" style={inp}/></div>
    <div style={{ marginBottom:sp.md }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'13px' }}>Spec</label><input value={spec} onChange={e => setSpec(e.target.value)} placeholder="e.g., 16x25x1 MERV 11" style={{ ...inp, fontFamily:'monospace' }}/></div>
    <div style={{ marginBottom:sp.lg }}><label style={{ display:'block', fontWeight:'500', color:colors.text, marginBottom:sp.xs, fontSize:'13px' }}>Qty</label><input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={{ ...inp, width:'80px' }}/></div>
    <button onClick={save} disabled={!name.trim()} style={{ width:'100%', padding:'12px', background: name.trim() ? colors.brandOrange : colors.bgMuted, color: name.trim() ? 'white' : colors.grayLight, border:'none', borderRadius:'10px', cursor: name.trim() ? 'pointer' : 'not-allowed', fontWeight:'600' }}>Save Part</button>
    </>}
  </div></div></div>;
};

const PartItem = ({ part, onDelete }) => {
  const { colors } = useTheme();
  return (
    <div style={{ padding:sp.md, background:colors.bgMuted, borderRadius:'8px', marginBottom:sp.sm }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:sp.sm }}>
        <div><div style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>{part.name}</div>{part.spec && <div style={{ fontSize:'13px', fontFamily:'monospace', color:colors.brandOrange }}>{part.spec}</div>}{part.qty > 1 && <div style={{ fontSize:'12px', color:colors.textMuted }}>Qty: {part.qty}</div>}</div>
        {onDelete && <button onClick={() => onDelete(part.id)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.grayLight, padding:'4px' }}><Icon name="x" size={14}/></button>}
      </div>
      <div style={{ display:'flex', gap:sp.sm }}>
        <button onClick={() => window.open(`https://amazon.com/s?k=${encodeURIComponent(part.name+' '+(part.spec||''))}`, '_blank')} style={{ flex:1, padding:'8px', background:'#ff9900', color:'#111', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'12px' }}>Amazon</button>
        <button onClick={() => window.open(`https://google.com/search?q=${encodeURIComponent(part.name+' '+(part.spec||''))}`, '_blank')} style={{ flex:1, padding:'8px', background:colors.bgCard, color:colors.text, border:`1px solid ${colors.border}`, borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'12px' }}>Google</button>
      </div>
    </div>
  );
};

const TaskDetail = ({ task, onClose, onDone, onSnooze, onAddPart, onDelete, onEdit, onDeletePart }) => {
  const { colors } = useTheme();
  const [showPart, setShowPart] = useState(false);
  const [copied, setCopied] = useState(false);
  const d = getDaysUntilDue(task.nextDue);
  const { text, isOverdue } = formatDueText(d);
  const copy = () => { navigator.clipboard.writeText(task.parts.map(p => `${p.name}: ${p.spec||'N/A'}`).join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <><Modal onClose={onClose}>
    <div style={{ padding:sp.lg, borderBottom:`1px solid ${colors.border}`, background:colors.bgCard, position:'sticky', top:0, zIndex:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.xs }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:catColors[task.category] }}/><span style={{ fontSize:'12px', color:colors.textMuted }}>{task.category}</span></div>
          <h2 style={{ margin:0, fontSize:'18px', fontWeight:'600', color:colors.text, lineHeight:1.3 }}>{task.title}</h2>
          <div style={{ fontSize:'13px', color: isOverdue ? colors.urgent : colors.textMuted, marginTop:sp.xs, display:'flex', alignItems:'center', gap:'4px' }}>{isOverdue && <Icon name="alertCircle" size={12} color={colors.urgent}/>}{text}</div>
        </div>
        <div style={{ display:'flex', gap:sp.xs }}><button onClick={onEdit} style={{ background:colors.bgMuted, border:'none', width:'34px', height:'34px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:colors.gray }}><Icon name="edit" size={14}/></button><button onClick={onClose} style={{ background:colors.bgMuted, border:'none', width:'34px', height:'34px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:colors.gray }}><Icon name="x" size={16}/></button></div>
      </div>
    </div>
    <div style={{ padding:sp.lg }}>
      <button onClick={() => onDone(task.id)} style={{ width:'100%', padding:'14px', background:colors.success, color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.lg }}><Icon name="check" size={18} color="white"/> Mark Done</button>
      <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.lg, padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}` }}><span style={{ fontSize:'13px', color:colors.textMuted }}>Snooze:</span>{[3,7,14].map(n => <button key={n} onClick={() => onSnooze(task.id, n)} style={{ padding:'6px 12px', background:colors.bgMuted, border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', color:colors.text, fontSize:'13px' }}>{n}d</button>)}</div>
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="calendar" size={14} color={colors.textMuted}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>Schedule</span></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:sp.md }}>
          <div><div style={{ fontSize:'11px', color:colors.textMuted }}>Frequency</div><div style={{ fontSize:'14px', fontWeight:'500', color:colors.text }}>{frequencyOptions.find(f => f.days===task.frequencyDays)?.label}</div></div>
          <div><div style={{ fontSize:'11px', color:colors.textMuted }}>Last done</div><div style={{ fontSize:'14px', fontWeight:'500', color:colors.text }}>{task.lastDone ? new Date(task.lastDone).toLocaleDateString() : 'Never'}</div></div>
        </div>
      </div>
      {task.notes && <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}><div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="note" size={14} color={colors.textMuted}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>Notes</span></div><p style={{ margin:0, fontSize:'14px', color:colors.text }}>{task.notes}</p></div>}
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:sp.md }}><div style={{ display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="package" size={14} color={colors.textMuted}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>Parts</span></div>{task.parts?.length > 0 && <button onClick={copy} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:'500', color: copied ? colors.success : colors.brandBlue }}>{copied ? 'Copied!' : 'Copy'}</button>}</div>
        {task.parts?.length ? task.parts.map(p => <PartItem key={p.id} part={p} onDelete={id => onDeletePart(task.id, id)}/>) : <p style={{ color:colors.textMuted, fontSize:'13px', textAlign:'center', padding:sp.md }}>No parts</p>}
        <button onClick={() => setShowPart(true)} style={{ width:'100%', padding:'12px', background:colors.brandOrange, color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginTop:sp.sm }}><Icon name="camera" size={16} color="white"/> Add Part</button>
      </div>
      <div style={{ display:'flex', gap:sp.sm, marginBottom:sp.lg }}>
        <button onClick={() => window.open(`https://youtube.com/results?search_query=how+to+${encodeURIComponent(task.title)}+DIY`, '_blank')} style={{ flex:1, padding:'12px', background:colors.bgCard, color:'#c00', border:`1px solid ${colors.border}`, borderRadius:'10px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm }}><Icon name="youtube" size={16} color="#c00"/> How-To</button>
        <button onClick={() => window.open(`https://google.com/maps/search/${encodeURIComponent(task.category+' repair near me')}`, '_blank')} style={{ flex:1, padding:'12px', background:colors.bgCard, color:colors.brandBlue, border:`1px solid ${colors.border}`, borderRadius:'10px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm }}><Icon name="mapPin" size={16} color={colors.brandBlue}/> Find Pro</button>
      </div>
      <button onClick={() => { if(confirm('Delete task?')) { onDelete(task.id); onClose(); }}} style={{ width:'100%', padding:'12px', background:'transparent', color:colors.urgent, border:`1px solid ${colors.urgent}30`, borderRadius:'10px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm }}><Icon name="trash" size={16} color={colors.urgent}/> Delete</button>
    </div>
  </Modal>{showPart && <AddPartModal onClose={() => setShowPart(false)} onAdd={p => onAddPart(task.id, p)}/>}</>;
};

// Main App
// Parts List Screen - shows parts from tasks due within 7 days
const PartsListScreen = ({ tasks, colors }) => {
  const tasksDueSoon = tasks.filter(t => {
    const d = getDaysUntilDue(t.nextDue);
    return d <= 7 && (t.parts?.length > 0);
  }).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  
  const allParts = tasksDueSoon.flatMap(t => 
    (t.parts || []).map(p => ({ ...p, taskTitle: t.title, taskId: t.id, daysUntil: getDaysUntilDue(t.nextDue), category: t.category }))
  );

  if (allParts.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:`${sp.xxl} ${sp.lg}` }}>
        <div style={{ width:'70px', height:'70px', borderRadius:'18px', background:colors.bgMuted, margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="clipboard" size={32} color={colors.grayLight}/>
        </div>
        <h2 style={{ color:colors.text, fontSize:'18px', fontWeight:'600', marginBottom:sp.sm }}>No parts needed</h2>
        <p style={{ color:colors.textMuted, fontSize:'14px' }}>Parts from tasks due within 7 days will appear here so you can order ahead.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom:sp.md }}>
        <h2 style={{ fontSize:'16px', fontWeight:'600', color:colors.text, marginBottom:sp.xs }}>Order These Parts</h2>
        <p style={{ fontSize:'13px', color:colors.textMuted }}>{allParts.length} part{allParts.length !== 1 ? 's' : ''} needed for tasks due within 7 days</p>
      </div>
      {tasksDueSoon.map(task => (
        <div key={task.id} style={{ marginBottom:sp.lg }}>
          <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm, padding:`${sp.sm} 0`, borderBottom:`1px solid ${colors.border}` }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'6px', background:`${catColors[task.category]}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={getCategoryIcon(task.category)} size={14} color={catColors[task.category]}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>{task.title}</div>
              <div style={{ fontSize:'12px', color: getDaysUntilDue(task.nextDue) < 0 ? colors.urgent : colors.brandOrange }}>
                {formatDueText(getDaysUntilDue(task.nextDue)).text}
              </div>
            </div>
          </div>
          {(task.parts || []).map(part => (
            <div key={part.id} style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', marginBottom:sp.sm, border:`1px solid ${colors.border}` }}>
              <div style={{ marginBottom:sp.sm }}>
                <div style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>{part.name}</div>
                {part.spec && <div style={{ fontSize:'13px', fontFamily:'monospace', color:colors.brandOrange, marginTop:'2px' }}>{part.spec}</div>}
                {part.qty > 1 && <div style={{ fontSize:'12px', color:colors.textMuted, marginTop:'2px' }}>Qty: {part.qty}</div>}
              </div>
              <div style={{ display:'flex', gap:sp.sm }}>
                <button onClick={() => window.open(`https://amazon.com/s?k=${encodeURIComponent(part.name+' '+(part.spec||''))}`, '_blank')} style={{ flex:1, padding:'10px', background:'#ff9900', color:'#111', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>Amazon</button>
                <button onClick={() => window.open(`https://google.com/search?tbm=shop&q=${encodeURIComponent(part.name+' '+(part.spec||''))}`, '_blank')} style={{ flex:1, padding:'10px', background:colors.bgMuted, color:colors.text, border:`1px solid ${colors.border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Google</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Bottom Navigation Bar
const BottomNav = ({ activeTab, onTabChange, colors, partsCount }) => {
  const tabs = [
    { id: 'parts', icon: 'clipboard', label: 'Parts', badge: partsCount },
    { id: 'tasks', icon: 'home', label: 'Tasks', primary: true },
    { id: 'analytics', icon: 'barChart', label: 'Health', primary: true },
    { id: 'settings', icon: 'settings', label: 'Settings' }
  ];
  
  return (
    <nav style={{ 
      position:'fixed', 
      bottom:0, 
      left:0, 
      right:0, 
      background:colors.bgCard, 
      borderTop:`1px solid ${colors.border}`,
      padding:`${sp.sm} ${sp.md}`,
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      zIndex:100
    }}>
      <div style={{ maxWidth:'500px', margin:'0 auto', display:'flex', alignItems:'flex-end', justifyContent:'space-around' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const size = tab.primary ? 52 : 44;
          return (
            <button 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{ 
                display:'flex', 
                flexDirection:'column', 
                alignItems:'center', 
                gap:'4px',
                background:'none', 
                border:'none', 
                cursor:'pointer',
                padding: tab.primary ? '0' : `${sp.xs} ${sp.sm}`,
                marginTop: tab.primary ? '-12px' : '0',
                position:'relative'
              }}
            >
              <div style={{
                width: size,
                height: size,
                borderRadius: tab.primary ? '16px' : '12px',
                background: isActive ? (tab.primary ? colors.brandOrange : `${colors.brandOrange}15`) : (tab.primary ? colors.bgMuted : 'transparent'),
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                boxShadow: tab.primary && isActive ? '0 4px 12px rgba(248, 90, 0, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                <Icon 
                  name={tab.icon} 
                  size={tab.primary ? 24 : 20} 
                  color={isActive ? (tab.primary ? 'white' : colors.brandOrange) : colors.grayLight}
                />
                {tab.badge > 0 && (
                  <div style={{ 
                    position:'absolute', 
                    top: tab.primary ? '-4px' : '0', 
                    right: tab.primary ? '-4px' : '4px',
                    background:colors.brandOrange, 
                    color:'white', 
                    fontSize:'10px', 
                    fontWeight:'700',
                    minWidth:'18px',
                    height:'18px',
                    borderRadius:'9px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    padding:'0 4px'
                  }}>{tab.badge}</div>
                )}
              </div>
              <span style={{ 
                fontSize:'11px', 
                fontWeight: isActive ? '600' : '500',
                color: isActive ? colors.brandOrange : colors.grayLight 
              }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Analytics Screen (inline version for tab)
const AnalyticsScreen = ({ tasks, colors }) => {
  const a = calcAnalytics(tasks);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthTasks = tasks.flatMap(t => (t.completions || []).filter(c => { const cd = new Date(c); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }));
    return { label: d.toLocaleString('default', { month: 'short' }), n: monthTasks.length };
  });
  const max = Math.max(...months.map(m => m.n), 1);
  const cats = Object.entries(a.catStats || {}).filter(([_, st]) => st.done > 0).sort((a, b) => b[1].done - a[1].done);
  
  return (
    <div>
      <div style={{ background:colors.bgCard, borderRadius:'16px', padding:sp.lg, textAlign:'center', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
        <div style={{ fontSize:'11px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:sp.sm }}>Home Health Score</div>
        <div style={{ fontSize:'52px', fontWeight:'700', color: a.score >= 80 ? colors.success : a.score >= 50 ? colors.brandOrange : colors.urgent, lineHeight:1 }}>{a.score}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:sp.xs, marginTop:sp.sm }}><Icon name={a.score >= 80 ? 'award' : a.score >= 50 ? 'trendingUp' : 'alertCircle'} size={16} color={a.score >= 80 ? colors.success : a.score >= 50 ? colors.brandOrange : colors.urgent}/><span style={{ fontSize:'14px', color:colors.textMuted }}>{a.score >= 80 ? 'Excellent!' : a.score >= 50 ? 'Good progress' : 'Needs attention'}</span></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:sp.sm, marginBottom:sp.md }}>
        {[{ icon:'checkCircle', color:colors.success, label:'Last 30 Days', value:a.c30, sub:'completed' },
          { icon:'award', color:colors.brandOrange, label:'Streak', value:a.streak, sub:'days' },
          { icon:'barChart', color:colors.brandBlue, label:'All Time', value:a.total, sub:'total' },
          { icon:'alertCircle', color:colors.urgent, label:'Overdue', value:a.overdue, sub:`of ${a.taskCount}` }
        ].map((s,i) => (
          <div key={i} style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, border:`1px solid ${colors.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:sp.xs, marginBottom:sp.xs }}><Icon name={s.icon} size={14} color={s.color}/><span style={{ fontSize:'11px', color:colors.textMuted }}>{s.label}</span></div>
            <div style={{ fontSize:'26px', fontWeight:'700', color: s.icon==='alertCircle' && s.value > 0 ? colors.urgent : colors.text }}>{s.value}</div>
            <div style={{ fontSize:'11px', color:colors.textMuted }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, marginBottom:sp.md, border:`1px solid ${colors.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="trendingUp" size={14} color={colors.brandBlue}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>6 Month Activity</span></div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', height:'80px', gap:sp.xs }}>
          {months.map((m,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'100%', background:colors.bgMuted, borderRadius:'4px', height:'60px', position:'relative' }}>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, background:colors.brandBlue, borderRadius:'4px', height:`${(m.n/max)*100}%`, minHeight: m.n > 0 ? '4px' : '0' }}/>
              </div>
              <span style={{ fontSize:'10px', color:colors.textMuted }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
      {cats.length > 0 && (
        <div style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, marginBottom:sp.md, border:`1px solid ${colors.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="barChart" size={14} color={colors.brandOrange}/><span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>By Category</span></div>
          {cats.map(([cat, st]) => (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'6px', background:`${catColors[cat]}20`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={getCategoryIcon(cat)} size={14} color={catColors[cat]}/></div>
              <div style={{ flex:1 }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}><span style={{ fontSize:'13px', fontWeight:'500', color:colors.text }}>{cat}</span><span style={{ fontSize:'12px', color:colors.textMuted }}>{st.done}</span></div><div style={{ height:'4px', background:colors.bgMuted, borderRadius:'2px' }}><div style={{ height:'100%', background:catColors[cat], width:`${Math.min(100, st.done/(a.total||1)*100*3)}%`, borderRadius:'2px' }}/></div></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Completion Log - shows most recent completion per task (current cycle) */}
      {(() => {
        // Get most recent completion for each task (only the latest one per task)
        const recentCompletions = tasks
          .filter(t => t.completions && t.completions.length > 0)
          .map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            completedAt: new Date(t.completions[t.completions.length - 1]),
            nextDue: t.nextDue
          }))
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 20); // Show last 20
        
        if (recentCompletions.length === 0) return null;
        
        // Group by relative time
        const now = new Date();
        const today = recentCompletions.filter(c => {
          const diff = now - c.completedAt;
          return diff < 86400000 && c.completedAt.getDate() === now.getDate();
        });
        const thisWeek = recentCompletions.filter(c => {
          const diff = now - c.completedAt;
          return diff < 7 * 86400000 && !today.includes(c);
        });
        const earlier = recentCompletions.filter(c => !today.includes(c) && !thisWeek.includes(c));
        
        const formatDate = (date) => {
          const diff = now - date;
          if (diff < 60000) return 'Just now';
          if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
          if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
          if (diff < 2 * 86400000) return 'Yesterday';
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        
        const CompletionItem = ({ item }) => (
          <div style={{ display:'flex', alignItems:'center', gap:sp.sm, padding:`${sp.sm} 0`, borderBottom:`1px solid ${colors.border}` }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'6px', background:`${catColors[item.category]}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="checkCircle" size={14} color={catColors[item.category]}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:colors.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</div>
              <div style={{ fontSize:'11px', color:colors.textMuted }}>{item.category}</div>
            </div>
            <div style={{ fontSize:'11px', color:colors.textMuted, flexShrink:0 }}>{formatDate(item.completedAt)}</div>
          </div>
        );
        
        return (
          <div style={{ background:colors.bgCard, borderRadius:'12px', padding:sp.md, border:`1px solid ${colors.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}>
              <Icon name="checkCircle" size={14} color={colors.success}/>
              <span style={{ fontSize:'12px', fontWeight:'600', color:colors.textMuted, textTransform:'uppercase' }}>Completion Log</span>
              <span style={{ fontSize:'11px', color:colors.textMuted, marginLeft:'auto' }}>{recentCompletions.length} tasks</span>
            </div>
            
            {today.length > 0 && (
              <>
                <div style={{ fontSize:'11px', fontWeight:'600', color:colors.brandOrange, marginBottom:sp.xs, marginTop:sp.sm }}>TODAY</div>
                {today.map(c => <CompletionItem key={c.id} item={c} />)}
              </>
            )}
            
            {thisWeek.length > 0 && (
              <>
                <div style={{ fontSize:'11px', fontWeight:'600', color:colors.textMuted, marginBottom:sp.xs, marginTop:sp.md }}>THIS WEEK</div>
                {thisWeek.map(c => <CompletionItem key={c.id} item={c} />)}
              </>
            )}
            
            {earlier.length > 0 && (
              <>
                <div style={{ fontSize:'11px', fontWeight:'600', color:colors.textMuted, marginBottom:sp.xs, marginTop:sp.md }}>EARLIER</div>
                {earlier.map(c => <CompletionItem key={c.id} item={c} />)}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};

// Settings Screen (inline version for tab)
const SettingsScreen = ({ settings, onSave, onClear, tasks, onImport, colors, isDark, toggle }) => {
  const [time, setTime] = useState(settings.reminderTime);
  const [confirm, setConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileRef = useRef(null);
  const inp = { padding:'12px', border:`1.5px solid ${colors.border}`, borderRadius:'8px', fontSize:'15px', background:colors.bgCard, color:colors.text, outline:'none' };
  const exportData = () => { const d = JSON.stringify({ version:'2.0', tasks: tasks.map(t => ({ ...t, lastDone: t.lastDone?.toISOString(), nextDue: t.nextDue?.toISOString() })) }, null, 2); const b = new Blob([d], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `homekeep-${new Date().toISOString().split('T')[0]}.json`; a.click(); };
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.tasks && Array.isArray(data.tasks)) {
          const imported = data.tasks.map(t => ({ ...t, lastDone: t.lastDone ? new Date(t.lastDone) : null, nextDue: t.nextDue ? new Date(t.nextDue) : new Date(), completions: t.completions || [], parts: t.parts || [] }));
          onImport(imported);
          setImportStatus({ success: true, count: imported.length });
        } else { setImportStatus({ success: false, error: 'Invalid file format' }); }
      } catch (err) { setImportStatus({ success: false, error: 'Could not read file' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <h2 style={{ fontSize:'18px', fontWeight:'600', color:colors.text, marginBottom:sp.md }}>Settings</h2>
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm }}><Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Dark Mode</span></div>
        <button onClick={toggle} style={{ width:'50px', height:'28px', borderRadius:'14px', border:'none', cursor:'pointer', background: isDark ? colors.brandOrange : colors.bgMuted, position:'relative' }}><div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left: isDark ? '25px' : '3px', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/></button>
      </div>
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.md }}><Icon name="clock" size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Reminder Time</span></div>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inp, width:'130px' }}/>
      </div>
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.border}`, marginBottom:sp.md }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="info" size={18} color={colors.textMuted}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.text }}>Data</span></div>
        <p style={{ fontSize:'13px', color:colors.textMuted, margin:`0 0 ${sp.md}` }}>{tasks.length} tasks</p>
        <div style={{ display:'flex', gap:sp.sm, flexWrap:'wrap' }}>
          <button onClick={exportData} disabled={!tasks.length} style={{ padding:'10px 14px', background: tasks.length ? colors.brandBlue : colors.bgMuted, color: tasks.length ? 'white' : colors.grayLight, border:'none', borderRadius:'8px', cursor: tasks.length ? 'pointer' : 'not-allowed', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="download" size={14} color={tasks.length ? 'white' : colors.grayLight}/> Export</button>
          <input type="file" accept=".json" ref={fileRef} onChange={handleImport} style={{ display:'none' }}/>
          <button onClick={() => fileRef.current?.click()} style={{ padding:'10px 14px', background:colors.bgMuted, color:colors.text, border:`1px solid ${colors.border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px', display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="upload" size={14} color={colors.text}/> Import</button>
        </div>
        {importStatus && (
          <div style={{ marginTop:sp.md, padding:sp.sm, background: importStatus.success ? colors.successBg : colors.urgentBg, borderRadius:'6px', fontSize:'13px', color: importStatus.success ? colors.success : colors.urgent }}>
            {importStatus.success ? `✓ Imported ${importStatus.count} tasks` : `✗ ${importStatus.error}`}
          </div>
        )}
      </div>
      <div style={{ padding:sp.md, background:colors.bgCard, borderRadius:'10px', border:`1px solid ${colors.urgent}30` }}>
        <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}><Icon name="trash" size={18} color={colors.urgent}/><span style={{ fontSize:'14px', fontWeight:'600', color:colors.urgent }}>Clear All Data</span></div>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ padding:'10px 14px', background:colors.urgentBg, color:colors.urgent, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Clear Data</button>
        ) : (
          <div style={{ display:'flex', gap:sp.sm }}>
            <button onClick={() => { onClear(); setConfirm(false); }} style={{ padding:'10px 14px', background:colors.urgent, color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>Yes, Delete</button>
            <button onClick={() => setConfirm(false)} style={{ padding:'10px 14px', background:colors.bgMuted, color:colors.text, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Cancel</button>
          </div>
        )}
      </div>
      <p style={{ textAlign:'center', fontSize:'11px', color:colors.grayLight, marginTop:sp.lg }}>HomeKeep v2.2</p>
    </div>
  );
};

export default function HomeKeep() {
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({ darkMode: false, reminderTime: '09:00' });
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [template, setTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [viewMode, setViewMode] = useState('category'); // 'status' or 'category'
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); // 'parts', 'tasks', 'analytics', 'settings'
  
  // Undo functionality
  const [undoStack, setUndoStack] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Bulk selection mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const colors = settings.darkMode ? darkColors : lightColors;
  const toggle = () => setSettings(s => ({ ...s, darkMode: !s.darkMode }));

  useEffect(() => { (async () => { const [t, s, setup] = await Promise.all([loadTasks(), loadSettings(), loadSetup()]); if (t) setTasks(t); if (s) setSettings(prev => ({ ...prev, ...s })); if (!setup && (!t || !t.length)) setShowSetup(true); setLoading(false); })(); }, []);
  useEffect(() => { if (!loading) saveTasks(tasks); }, [tasks, loading]);
  useEffect(() => { if (!loading) saveSettings(settings); }, [settings, loading]);

  // Filter tasks by search and category
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()) || (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !filterCategory || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const { overdue, dueSoon, later, done } = categorizeTasks(filteredTasks);
  const isEmpty = !tasks.length;
  const noResults = tasks.length > 0 && filteredTasks.length === 0;

  // Critical tasks: overdue + safety tasks due within 7 days + user-flagged priority
  const criticalTasks = filteredTasks.filter(t => {
    const d = getDaysUntilDue(t.nextDue);
    const isOverdue = d < 0;
    const isSafetyUrgent = t.category === 'Safety' && d <= 7 && d >= 0;
    const isUserPriority = t.priority === true;
    return isOverdue || isSafetyUrgent || isUserPriority;
  }).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));

  // Group tasks by category for category view
  const tasksByCategory = categories.reduce((acc, cat) => {
    const catTasks = filteredTasks.filter(t => t.category === cat);
    if (catTasks.length > 0) acc[cat] = catTasks.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
    return acc;
  }, {});

  // Parts due within 7 days - for the Parts List screen
  const tasksDueSoon = tasks.filter(t => {
    const d = getDaysUntilDue(t.nextDue);
    return d <= 7 && (t.parts?.length > 0);
  });
  const partsDueSoon = tasksDueSoon.flatMap(t => (t.parts || []).map(p => ({ ...p, taskTitle: t.title, taskId: t.id, daysUntil: getDaysUntilDue(t.nextDue) })));

  const [completingId, setCompletingId] = useState(null);
  
  // Enhanced markDone with undo support
  const markDone = useCallback((id) => { 
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Save state for undo
    const prevState = { ...task };
    setUndoStack(prev => [...prev.slice(-9), { type: 'complete', task: prevState }]);
    
    setCompletingId(id);
    setTimeout(() => {
      setTasks(p => p.map(t => t.id === id ? { 
        ...t, 
        lastDone: new Date(), 
        nextDue: new Date(Date.now() + t.frequencyDays * 86400000), 
        completions: [...(t.completions||[]), new Date().toISOString()] 
      } : t)); 
      setSelected(null);
      setCompletingId(null);
      setToast({ message: `"${task.title}" completed!`, action: 'Undo', taskId: id });
    }, 600);
  }, [tasks]);
  
  // Undo last action
  const handleUndo = useCallback(() => {
    const lastAction = undoStack[undoStack.length - 1];
    if (!lastAction) return;
    
    if (lastAction.type === 'complete') {
      setTasks(p => p.map(t => t.id === lastAction.task.id ? lastAction.task : t));
    } else if (lastAction.type === 'delete') {
      setTasks(p => [...p, lastAction.task]);
    }
    
    setUndoStack(prev => prev.slice(0, -1));
    setToast(null);
  }, [undoStack]);
  
  // Bulk complete
  const bulkComplete = useCallback(() => {
    if (selectedIds.size === 0) return;
    
    const now = new Date();
    setTasks(p => p.map(t => selectedIds.has(t.id) ? {
      ...t,
      lastDone: now,
      nextDue: new Date(now.getTime() + t.frequencyDays * 86400000),
      completions: [...(t.completions||[]), now.toISOString()]
    } : t));
    
    setToast({ message: `${selectedIds.size} tasks completed!` });
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds]);
  
  // Toggle bulk selection
  const toggleBulkSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  
  const snooze = (id, days) => { setTasks(p => p.map(t => t.id === id ? { ...t, nextDue: new Date(Date.now() + days * 86400000) } : t)); setSelected(null); };
  const addPart = (tid, part) => { setTasks(p => p.map(t => t.id === tid ? { ...t, parts: [...(t.parts||[]), part] } : t)); setSelected(s => s?.id === tid ? { ...s, parts: [...(s.parts||[]), part] } : s); };
  const delPart = (tid, pid) => { setTasks(p => p.map(t => t.id === tid ? { ...t, parts: t.parts.filter(x => x.id !== pid) } : t)); setSelected(s => s?.id === tid ? { ...s, parts: s.parts.filter(x => x.id !== pid) } : s); };
  const addTask = task => setTasks(p => [...p, task]);
  
  // Enhanced delete with undo
  const delTask = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setUndoStack(prev => [...prev.slice(-9), { type: 'delete', task }]);
      setToast({ message: `"${task.title}" deleted`, action: 'Undo' });
    }
    setTasks(p => p.filter(t => t.id !== id));
  }, [tasks]);
  
  const editTask = upd => { setTasks(p => p.map(t => t.id === upd.id ? upd : t)); setSelected(upd); };
  const selTemplate = t => { setShowTemplates(false); setTemplate(t); setShowAdd(true); };
  const clearData = async () => { setTasks([]); try { await window.storage.delete(STORAGE_KEYS.TASKS); } catch(e){} };
  const finishSetup = async t => { setTasks(t); await saveSetup(); setShowSetup(false); };
  const skipSetup = async () => { await saveSetup(); setShowSetup(false); };

  if (loading) return <div style={{ minHeight:'100vh', background:colors.bgPrimary, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, sans-serif' }}><div style={{ textAlign:'center' }}><Logo dark={settings.darkMode}/><p style={{ color:colors.textMuted, marginTop:sp.md }}>Loading...</p></div></div>;

  return (
    <ThemeContext.Provider value={{ colors, isDark: settings.darkMode, toggle }}>
      <GlobalStyles />
      {toast && (
        <Toast 
          message={toast.message} 
          action={toast.action} 
          onAction={handleUndo} 
          onClose={() => setToast(null)} 
          colors={colors}
        />
      )}
      {showSetup ? <SetupWizard onComplete={finishSetup} onSkip={skipSetup}/> : (
        <div style={{ minHeight:'100vh', background:colors.bgPrimary, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <header style={{ background:colors.bgCard, borderBottom:`1px solid ${colors.border}`, padding:`${sp.md} ${sp.lg}`, position:'sticky', top:0, zIndex:50 }}>
            <div style={{ maxWidth:'500px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Logo dark={settings.darkMode}/>
            </div>
          </header>
          {activeTab === 'tasks' && overdue.length > 0 && <div style={{ background:colors.urgentBg, padding:`${sp.sm} ${sp.lg}`, animation: 'slideIn 0.3s ease' }}><div style={{ maxWidth:'500px', margin:'0 auto', display:'flex', alignItems:'center', gap:sp.sm }}><Icon name="alertCircle" size={14} color={colors.urgent}/><span style={{ color:colors.urgent, fontWeight:'600', fontSize:'13px' }}>{overdue.length} task{overdue.length !== 1 ? 's' : ''} overdue</span></div></div>}
          <main style={{ padding:sp.lg, maxWidth:'500px', margin:'0 auto', paddingBottom:'120px' }}>
            
            {/* TASKS TAB */}
            {activeTab === 'tasks' && (<>
            {/* Search, Filter, and View Mode - only show when there are tasks */}
            {!isEmpty && (
              <div style={{ marginBottom:sp.md }}>
                <div style={{ position:'relative', marginBottom:sp.sm }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search tasks or notes..."
                    aria-label="Search tasks"
                    style={{
                      width:'100%',
                      padding:'12px 14px 12px 40px',
                      border:`1.5px solid ${colors.border}`,
                      borderRadius:'12px',
                      fontSize:'15px',
                      background:colors.bgCard,
                      color:colors.text,
                      outline:'none',
                      boxSizing:'border-box'
                    }}
                  />
                  <div style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }}>
                    <Icon name="search" size={16} color={colors.grayLight} />
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:'4px' }}>
                      <Icon name="x" size={14} color={colors.grayLight} />
                    </button>
                  )}
                </div>
                {/* View Mode Toggle + Category Filters */}
                <div style={{ display:'flex', alignItems:'center', gap:sp.sm, marginBottom:sp.sm }}>
                  <div style={{ display:'flex', background:colors.bgMuted, borderRadius:'8px', padding:'2px' }}>
                    <button onClick={() => setViewMode('status')} style={{ padding:'6px 12px', borderRadius:'6px', border:'none', background: viewMode === 'status' ? colors.bgCard : 'transparent', color: viewMode === 'status' ? colors.text : colors.textMuted, fontSize:'12px', fontWeight:'500', cursor:'pointer', boxShadow: viewMode === 'status' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>By Status</button>
                    <button onClick={() => setViewMode('category')} style={{ padding:'6px 12px', borderRadius:'6px', border:'none', background: viewMode === 'category' ? colors.bgCard : 'transparent', color: viewMode === 'category' ? colors.text : colors.textMuted, fontSize:'12px', fontWeight:'500', cursor:'pointer', boxShadow: viewMode === 'category' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>By Category</button>
                  </div>
                  <div style={{ flex:1 }}/>
                  <span style={{ fontSize:'12px', color:colors.textMuted }}>{filteredTasks.length} tasks</span>
                </div>
                <div style={{ display:'flex', gap:sp.xs, overflowX:'auto', paddingBottom:sp.xs }}>
                  <button
                    onClick={() => setFilterCategory(null)}
                    style={{
                      padding:'6px 12px',
                      borderRadius:'16px',
                      border:'none',
                      background: !filterCategory ? colors.brandOrange : colors.bgMuted,
                      color: !filterCategory ? 'white' : colors.textMuted,
                      fontSize:'12px',
                      fontWeight:'500',
                      cursor:'pointer',
                      whiteSpace:'nowrap'
                    }}
                  >All</button>
                  {categories.filter(cat => tasks.some(t => t.category === cat)).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                      style={{
                        padding:'6px 12px',
                        borderRadius:'16px',
                        border:'none',
                        background: filterCategory === cat ? catColors[cat] : colors.bgMuted,
                        color: filterCategory === cat ? 'white' : colors.textMuted,
                        fontSize:'12px',
                        fontWeight:'500',
                        cursor:'pointer',
                        whiteSpace:'nowrap',
                        display:'flex',
                        alignItems:'center',
                        gap:'4px'
                      }}
                    >
                      <Icon name={getCategoryIcon(cat)} size={12} color={filterCategory === cat ? 'white' : colors.textMuted} />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isEmpty ? (
              <div style={{ textAlign:'center', padding:`${sp.xxl} ${sp.lg}` }}>
                <div style={{ width:'70px', height:'70px', borderRadius:'18px', background:colors.bgMuted, margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="home" size={32} color={colors.grayLight}/></div>
                <h2 style={{ color:colors.text, fontSize:'18px', fontWeight:'600', marginBottom:sp.sm }}>No tasks yet</h2>
                <p style={{ color:colors.textMuted, fontSize:'14px', marginBottom:sp.lg }}>Add your first maintenance task.</p>
                <button onClick={() => setShowTemplates(true)} style={{ width:'100%', maxWidth:'260px', padding:'14px', background:colors.brandOrange, color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:sp.sm, marginBottom:sp.sm, marginLeft:'auto', marginRight:'auto' }}><Icon name="sparkles" size={18} color="white"/> Browse Templates</button>
                <button onClick={() => setShowAdd(true)} style={{ width:'100%', maxWidth:'260px', padding:'12px', background:colors.bgCard, color:colors.text, border:`1.5px solid ${colors.border}`, borderRadius:'12px', cursor:'pointer', fontWeight:'500', fontSize:'14px', display:'block', marginLeft:'auto', marginRight:'auto' }}>Create Custom</button>
              </div>
            ) : (
              <>
                {noResults ? (
                  <div style={{ textAlign:'center', padding:`${sp.xl} ${sp.lg}` }}>
                    <div style={{ width:'60px', height:'60px', borderRadius:'14px', background:colors.bgMuted, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon name="search" size={24} color={colors.grayLight}/>
                    </div>
                    <h3 style={{ color:colors.text, fontSize:'16px', fontWeight:'600', marginBottom:sp.xs }}>No tasks found</h3>
                    <p style={{ color:colors.textMuted, fontSize:'14px', marginBottom:sp.md }}>
                      {searchQuery ? `No results for "${searchQuery}"` : `No ${filterCategory} tasks`}
                    </p>
                    <button onClick={() => { setSearchQuery(''); setFilterCategory(null); }} style={{ padding:'10px 20px', background:colors.bgCard, color:colors.text, border:`1.5px solid ${colors.border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500', fontSize:'13px' }}>Clear filters</button>
                  </div>
                ) : (
                  <>
                    {/* Critical Section - Only in Status view */}
                    {viewMode === 'status' && criticalTasks.length > 0 && !filterCategory && (
                      <CriticalSection tasks={criticalTasks} onDone={markDone} onView={setSelected} completingId={completingId} />
                    )}
                    
                    {/* View Mode: By Status */}
                    {viewMode === 'status' && (
                      <>
                        <TaskSection title="Overdue" tasks={overdue.filter(t => !criticalTasks.some(c => c.id === t.id))} onDone={markDone} onView={setSelected} urgent completingId={completingId}/>
                        <TaskSection title="Due Soon" tasks={dueSoon.filter(t => !criticalTasks.some(c => c.id === t.id))} onDone={markDone} onView={setSelected} completingId={completingId}/>
                        <TaskSection title="Later" tasks={later} onDone={markDone} onView={setSelected} open={false} completingId={completingId}/>
                        <TaskSection title="Done" tasks={done} onDone={markDone} onView={setSelected} open={false} completingId={completingId}/>
                      </>
                    )}
                    
                    {/* View Mode: By Category */}
                    {viewMode === 'category' && (
                      <>
                        {Object.entries(tasksByCategory).map(([cat, catTasks]) => (
                          <CategorySection 
                            key={cat} 
                            category={cat} 
                            tasks={catTasks} 
                            onDone={markDone} 
                            onView={setSelected}
                            defaultOpen={catTasks.some(t => getDaysUntilDue(t.nextDue) < 0)}
                            completingId={completingId}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            )}
            </>)}
            
            {/* PARTS TAB */}
            {activeTab === 'parts' && (
              <div>
                <h2 style={{ color:colors.text, fontSize:'18px', marginBottom:sp.md }}>Parts List</h2>
                <PartsListScreen tasks={tasks} colors={colors} />
              </div>
            )}
            
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div>
                <h2 style={{ color:colors.text, fontSize:'18px', marginBottom:sp.md }}>Home Health</h2>
                <AnalyticsScreen tasks={tasks} colors={colors} />
              </div>
            )}
            
            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <SettingsScreen 
                settings={settings} 
                onSave={setSettings} 
                onClear={clearData} 
                tasks={tasks} 
                onImport={imported => setTasks(imported)} 
                colors={colors}
                isDark={settings.darkMode}
                toggle={toggle}
              />
            )}
          </main>
          
          {/* Bottom Navigation */}
          <BottomNav 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            colors={colors}
            partsCount={partsDueSoon.length}
          />
          
          {/* FAB for adding tasks - only on tasks tab */}
          {activeTab === 'tasks' && !isEmpty && (
            <button onClick={() => setShowAddSheet(true)} style={{ position:'fixed', bottom:'90px', right:sp.lg, width:'52px', height:'52px', borderRadius:'14px', background:colors.brandOrange, color:'white', border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(248, 90, 0, 0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:90 }}>
              <Icon name="plus" size={22} color="white"/>
            </button>
          )}
          
          {showAddSheet && <AddActionSheet onClose={() => setShowAddSheet(false)} onBrowseTemplates={() => { setShowAddSheet(false); setShowTemplates(true); }} onCreateCustom={() => { setShowAddSheet(false); setShowAdd(true); }}/>}
          {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} onDone={markDone} onSnooze={snooze} onAddPart={addPart} onDelete={delTask} onEdit={() => setShowEdit(true)} onDeletePart={delPart}/>}
          {showAdd && <AddTaskModal onClose={() => { setShowAdd(false); setTemplate(null); }} onAdd={addTask} template={template}/>}
          {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onSelect={selTemplate} existing={tasks} onQuickAdd={task => { addTask(task); }}/>}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} settings={settings} onSave={setSettings} onClear={clearData} tasks={tasks} onAnalytics={() => setShowAnalytics(true)} onImport={imported => setTasks(imported)}/>}
          {showEdit && selected && <EditTaskModal task={selected} onClose={() => setShowEdit(false)} onSave={editTask}/>}
          {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} tasks={tasks}/>}
        </div>
      )}
    </ThemeContext.Provider>
  );
}
