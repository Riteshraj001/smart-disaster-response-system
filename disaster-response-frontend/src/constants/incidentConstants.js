export const DISASTER_TYPES = [
  'Fire',
  'Gas Leak',
  'Flood',
  'Extreme Temperature',
  'Structural/Vibration Emergency',
  'Other',
];

export const INCIDENT_STATUSES = [
  'PENDING_VERIFICATION',
  'VERIFIED',
  'ASSIGNED',
  'RESPONSE_DISPATCHED',
  'RESPONDING',
  'RESPONSE_COMPLETED',
  'RESOLVED',
  'REJECTED',
];

export const SEVERITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

export const INCIDENT_SOURCES = {
  CITIZEN: 'CITIZEN',
  IOT_SENSOR: 'IOT_SENSOR',
  MANUAL: 'CITIZEN',
  SENSOR: 'IOT_SENSOR',
};

export const SEVERITY_CONFIG = {
  Low: {
    label: 'Low',
    description: 'Minor localized incident, routine monitoring',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    dotBg: 'bg-slate-500',
    iconColor: 'text-slate-600',
  },
  Medium: {
    label: 'Medium',
    description: 'Moderate hazard, requires field response unit',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotBg: 'bg-amber-500',
    iconColor: 'text-amber-600',
  },
  High: {
    label: 'High',
    description: 'Severe threat to life, assets, or infrastructure',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-300',
    dotBg: 'bg-orange-500',
    iconColor: 'text-orange-600',
  },
  Critical: {
    label: 'Critical',
    description: 'Catastrophic event requiring multi-agency mass dispatch',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-300',
    dotBg: 'bg-red-600',
    iconColor: 'text-red-600',
  },
};

export const STATUS_CONFIG = {
  PENDING_VERIFICATION: {
    label: 'PENDING_VERIFICATION',
    displayLabel: 'Pending Verification',
    description: 'Awaiting authority review and verification',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotBg: 'bg-amber-500',
    step: 1,
  },
  VERIFIED: {
    label: 'VERIFIED',
    displayLabel: 'Verified',
    description: 'Incident verified by emergency authority',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    dotBg: 'bg-blue-600',
    step: 2,
  },
  ASSIGNED: {
    label: 'ASSIGNED',
    displayLabel: 'Team Assigned',
    description: 'A response team has been assigned and is awaiting dispatch',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    dotBg: 'bg-indigo-600',
    step: 3,
  },
  RESPONSE_DISPATCHED: {
    label: 'RESPONSE_DISPATCHED',
    displayLabel: 'Response Dispatched',
    description: 'Response team en route or actively deployed',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    dotBg: 'bg-indigo-600',
    step: 3,
  },
  RESPONDING: {
    label: 'RESPONDING',
    displayLabel: 'Responding',
    description: 'Response team on-site and actively handling the incident',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
    badgeBorder: 'border-violet-300',
    dotBg: 'bg-violet-600',
    step: 3.5,
  },
  RESPONSE_COMPLETED: {
    label: 'RESPONSE_COMPLETED',
    displayLabel: 'Response Completed',
    description: 'On-site operations concluded, final assessment',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-300',
    dotBg: 'bg-teal-600',
    step: 4,
  },
  RESOLVED: {
    label: 'RESOLVED',
    displayLabel: 'Resolved',
    description: 'Emergency safely resolved and closed',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    dotBg: 'bg-emerald-600',
    step: 5,
  },
  REJECTED: {
    label: 'REJECTED',
    displayLabel: 'Rejected / False Alarm',
    description: 'Determined to be invalid or false report',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    dotBg: 'bg-rose-600',
    step: 0,
  },
  // Legacy aliases support
  Pending: {
    label: 'PENDING_VERIFICATION',
    displayLabel: 'Pending Verification',
    description: 'Awaiting authority review and verification',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotBg: 'bg-amber-500',
    step: 1,
  },
  Active: {
    label: 'RESPONSE_DISPATCHED',
    displayLabel: 'Response Dispatched',
    description: 'Response team en route or actively deployed',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    dotBg: 'bg-indigo-600',
    step: 3,
  },
  Resolved: {
    label: 'RESOLVED',
    displayLabel: 'Resolved',
    description: 'Emergency safely resolved and closed',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    dotBg: 'bg-emerald-600',
    step: 5,
  },
};

export const RESPONSE_TEAMS = [
  'Unassigned',
  'Station 1 Fire & Rescue Engine',
  'Campus Rapid Emergency Medical Unit',
  'Hazmat & Gas Containment Squad',
  'Structural Evacuation & Safety Team',
  'Disaster Relief Task Force',
];

export const EMERGENCY_HELPLINES = [
  { name: 'National Emergency Number', number: '112', desc: 'Unified 24/7 all-emergency dispatch' },
  { name: 'Fire Emergency Service', number: '101', desc: 'Fire brigade & hazardous rescue' },
  { name: 'Police Control Room', number: '100', desc: 'Law enforcement & perimeter control' },
  { name: 'Ambulance & EMS', number: '108', desc: 'Medical emergency & paramedic response' },
  { name: 'Disaster Management Cell', number: '1070', desc: 'National/State disaster coordination' },
];

export const IOT_DEVICES = [
  {
    deviceId: 'ESP32-001',
    deviceType: 'ESP32 DevKit V1 Multi-Sensor Unit',
    location: 'Academic Block A - Ground Floor',
    status: 'ONLINE',
    lastSeen: '8 seconds ago',
    lastSeenTimestamp: Date.now() - 8000,
    sensors: [
      { name: 'Flame Sensor (IR)', type: 'Optical Flame', currentReading: 'NORMAL (No Flame)', threshold: 'Flame Detected', status: 'NORMAL' },
      { name: 'MQ-2 Sensor', type: 'Gas & Smoke', currentReading: '120 PPM', threshold: '400 PPM', status: 'NORMAL' },
      { name: 'DHT11 Sensor', type: 'Temperature & Humidity', currentReading: '28.5°C / 54% RH', threshold: '40.0°C', status: 'NORMAL' },
      { name: 'MPU6050 Sensor', type: 'Accelerometer / Vibration', currentReading: '1.01g (Stable)', threshold: '1.50g', status: 'NORMAL' },
    ],
  },
  {
    deviceId: 'ESP32-002',
    deviceType: 'ESP32 DevKit V1 Multi-Sensor Unit',
    location: 'Chemistry Lab - Science Block',
    status: 'ONLINE',
    lastSeen: '14 seconds ago',
    lastSeenTimestamp: Date.now() - 14000,
    sensors: [
      { name: 'Flame Sensor (IR)', type: 'Optical Flame', currentReading: 'NORMAL (No Flame)', threshold: 'Flame Detected', status: 'NORMAL' },
      { name: 'MQ-2 Sensor', type: 'Gas & Smoke', currentReading: '180 PPM', threshold: '400 PPM', status: 'NORMAL' },
      { name: 'DHT11 Sensor', type: 'Temperature & Humidity', currentReading: '27.0°C / 50% RH', threshold: '40.0°C', status: 'NORMAL' },
      { name: 'MPU6050 Sensor', type: 'Accelerometer / Vibration', currentReading: '0.99g (Stable)', threshold: '1.50g', status: 'NORMAL' },
    ],
  },
  {
    deviceId: 'ESP32-003',
    deviceType: 'ESP32 DevKit V1 Multi-Sensor Unit',
    location: 'Hostel Block 3 - Utility Room',
    status: 'ONLINE',
    lastSeen: '25 seconds ago',
    lastSeenTimestamp: Date.now() - 25000,
    sensors: [
      { name: 'Flame Sensor (IR)', type: 'Optical Flame', currentReading: 'NORMAL (No Flame)', threshold: 'Flame Detected', status: 'NORMAL' },
      { name: 'MQ-2 Sensor', type: 'Gas & Smoke', currentReading: '95 PPM', threshold: '400 PPM', status: 'NORMAL' },
      { name: 'DHT11 Sensor', type: 'Temperature & Humidity', currentReading: '29.2°C / 60% RH', threshold: '40.0°C', status: 'NORMAL' },
      { name: 'MPU6050 Sensor', type: 'Accelerometer / Vibration', currentReading: '1.02g (Stable)', threshold: '1.50g', status: 'NORMAL' },
    ],
  },
];

export const DEFAULT_IOT_SETTINGS = {
  gasThreshold: 400, // PPM
  temperatureThreshold: 40.0, // °C
  vibrationThreshold: 1.5, // g (magnitude)
  flameDetectionEnabled: true,
  cooldownSeconds: 60, // Avoid duplicate incidents within 60s
  offlineTimeoutSeconds: 45, // Device offline if no heartbeat in 45s
};

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';
