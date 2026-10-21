import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Cpu,
  Flame,
  MapPin,
  RefreshCw,
  Thermometer,
  Wind,
  Wifi,
  WifiOff,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import iotService from '../../services/iotService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';

const rangeOptions = ['10m', '1h', '24h'];
const severityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimestamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getNumeric = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDeviceStatus = (device) => {
  const candidate = String(device?.status || '').toUpperCase();
  if (candidate === 'ONLINE' || candidate === 'OFFLINE' || candidate === 'STALE') {
    return candidate;
  }

  const lastSeenMs = Number(device?.lastSeenTimestamp ?? device?.lastSeenTime ?? 0);
  if (!lastSeenMs) return 'OFFLINE';

  const ageMinutes = (Date.now() - lastSeenMs) / 60000;
  if (ageMinutes <= 5) return 'ONLINE';
  if (ageMinutes <= 30) return 'STALE';
  return 'OFFLINE';
};

const getStatusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ONLINE') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (normalized === 'STALE') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
};

const getReadingValue = (reading, key) => {
  if (key === 'acceleration') {
    const x = getNumeric(reading.accelerationX, 0) || 0;
    const y = getNumeric(reading.accelerationY, 0) || 0;
    const z = getNumeric(reading.accelerationZ, 1) || 1;
    return Math.sqrt(x * x + y * y + z * z);
  }

  return getNumeric(reading[key], null);
};

const getChartSeries = (readings, key, threshold) => {
  const points = (readings || [])
    .map((reading) => {
      const ts = new Date(reading.timestamp || reading.createdAt || reading.time || reading.lastSeen || Date.now()).getTime();
      const value = getReadingValue(reading, key);
      return Number.isFinite(ts) && Number.isFinite(value) ? { ts, value } : null;
    })
    .filter(Boolean);

  if (!points.length) return { points: [], minValue: null, maxValue: null, thresholdY: null };

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const paddedMin = minValue - range * 0.15;
  const paddedMax = maxValue + range * 0.15 || paddedMin + 1;

  const ordered = points.map((point, index) => ({
    ...point,
    x: (index / Math.max(points.length - 1, 1)) * 100,
    y: 100 - (((point.value - paddedMin) / Math.max(paddedMax - paddedMin, 0.0001)) * 80 + 10),
  }));

  const thresholdY = Number.isFinite(threshold)
    ? 100 - (((threshold - paddedMin) / Math.max(paddedMax - paddedMin, 0.0001)) * 80 + 10)
    : null;

  return { points: ordered, minValue, maxValue, thresholdY };
};

const buildLinePath = (points) => {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
};

const ChartCard = ({ title, unit, value, threshold, status, readings, color, sensorKey, emptyMessage }) => {
  const { points, thresholdY } = getChartSeries(readings, sensorKey, threshold);
  const linePath = buildLinePath(points);
  const hasData = points.length > 0;
  const Icon = {
    temperature: Thermometer,
    humidity: Activity,
    gasLevel: Wind,
    acceleration: Activity,
  }[sensorKey] || Activity;

  const badgeClasses = status === 'alert'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{title}</p>
            <p className="truncate text-sm font-semibold text-[#172033]">{value ?? 'Waiting for telemetry'}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClasses}`}>
          {status === 'alert' ? 'Alert' : 'Normal'}
        </span>
      </div>

      <div className="h-28 overflow-hidden rounded-lg border border-[#EEF2F7] bg-[#F8FAFC] p-2">
        {hasData ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            {Number.isFinite(thresholdY) && (
              <line x1="0" x2="100" y1={thresholdY} y2={thresholdY} stroke="#94A3B8" strokeWidth="0.7" strokeDasharray="3 3" />
            )}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[11px] text-[#64748B]">{emptyMessage}</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
        <span>{Number.isFinite(threshold) ? `Threshold ${threshold}${unit}` : 'Threshold unavailable'}</span>
        <span>{readings?.length ? `${readings.length} samples` : 'No samples'}</span>
      </div>
    </div>
  );
};

const SensorMonitoringPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [settings, setSettings] = useState({});
  const [range, setRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [incidentData, deviceData, settingsData] = await Promise.all([
        incidentService.getIncidents(),
        iotService.getSensors(),
        iotService.getSettings(),
      ]);

      const normalizedDevices = Array.isArray(deviceData) ? deviceData : [];
      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setDevices(normalizedDevices);
      setSettings(settingsData || {});

      const primaryDevice = normalizedDevices.find((device) => device.deviceId === 'ESP32-001') || normalizedDevices[0] || null;
      const primaryDeviceId = primaryDevice?.deviceId || 'ESP32-001';
      const readingData = await iotService.getReadings(primaryDeviceId);
      setReadings(Array.isArray(readingData) ? readingData : []);
      setError('');
    } catch (err) {
      console.error('Failed to load sensor records:', err);
      setError('Unable to load live sensor telemetry from the backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const primaryDevice = useMemo(
    () => devices.find((device) => device.deviceId === 'ESP32-001') || devices[0] || null,
    [devices]
  );

  const deviceStatus = getDeviceStatus(primaryDevice);
  const connectionTone = getStatusTone(deviceStatus);

  const filteredReadings = useMemo(() => {
    const cutoff = {
      '10m': 10 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }[range] || 60 * 60 * 1000;

    const now = Date.now();
    return readings.filter((reading) => {
      const ts = new Date(reading.timestamp || reading.createdAt || reading.time || Date.now()).getTime();
      return Number.isFinite(ts) && now - ts <= cutoff;
    });
  }, [range, readings]);

  const latestReading = filteredReadings.length ? filteredReadings[filteredReadings.length - 1] : null;

  const temperatureValue = latestReading ? `${getNumeric(latestReading.temperature, 0).toFixed(1)}°C` : 'No telemetry';
  const humidityValue = latestReading ? `${getNumeric(latestReading.humidity, 0).toFixed(0)}%` : 'No telemetry';
  const gasValue = latestReading ? `${getNumeric(latestReading.gasLevel, 0)} ADC` : 'No telemetry';
  const movementValue = latestReading
    ? `${Math.sqrt(
        (getNumeric(latestReading.accelerationX, 0) || 0) ** 2 +
        (getNumeric(latestReading.accelerationY, 0) || 0) ** 2 +
        (getNumeric(latestReading.accelerationZ, 1) || 1) ** 2
      ).toFixed(2)}g`
    : 'No telemetry';
  const flameValue = latestReading ? (latestReading.flameDetected ? 'Detected' : 'Not detected') : 'No telemetry';

  const iotIncidents = incidents.filter(
    (incident) => (incident.source || '').toUpperCase() === 'IOT_SENSOR' || Boolean(incident.deviceId)
  );

  const sortedIotIncidents = [...iotIncidents].sort((a, b) => {
    const first = severityWeight[String(a.severity || 'Medium').trim()] ?? 3;
    const second = severityWeight[String(b.severity || 'Medium').trim()] ?? 3;
    if (first !== second) return first - second;
    return new Date(b.reportedAt || b.createdAt || 0) - new Date(a.reportedAt || a.createdAt || 0);
  });

  const chartConfig = [
    {
      key: 'temperature',
      title: 'Temperature',
      unit: '°C',
      threshold: Number(settings.temperatureThreshold),
      color: '#ef4444',
      sensorKey: 'temperature',
      value: temperatureValue,
      status: latestReading && getNumeric(latestReading.temperature, 0) > Number(settings.temperatureThreshold || 0) ? 'alert' : 'normal',
    },
    {
      key: 'humidity',
      title: 'Humidity',
      unit: '%',
      threshold: Number(settings.humidityThreshold),
      color: '#2563eb',
      sensorKey: 'humidity',
      value: humidityValue,
      status: 'normal',
    },
    {
      key: 'gasLevel',
      title: 'MQ-2 Raw ADC',
      unit: ' ADC',
      threshold: Number(settings.gasThreshold),
      color: '#f59e0b',
      sensorKey: 'gasLevel',
      value: gasValue,
      status: latestReading && getNumeric(latestReading.gasLevel, 0) > Number(settings.gasThreshold || 0) ? 'alert' : 'normal',
    },
    {
      key: 'motion',
      title: 'MPU6050',
      unit: 'g',
      threshold: Number(settings.vibrationThreshold),
      color: '#8b5cf6',
      sensorKey: 'acceleration',
      value: movementValue,
      status: latestReading && Math.sqrt((getNumeric(latestReading.accelerationX, 0) || 0) ** 2 + (getNumeric(latestReading.accelerationY, 0) || 0) ** 2 + (getNumeric(latestReading.accelerationZ, 1) || 1) ** 2) > Number(settings.vibrationThreshold || 0) ? 'alert' : 'normal',
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">IoT Monitoring</h1>
          <p className="mt-1 text-xs text-[#64748B]">Sensor status, telemetry, and automated alerts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${connectionTone}`}>
            {deviceStatus === 'ONLINE' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {deviceStatus}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              fetchData();
            }}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172033] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
          <LoadingSpinner message="Loading sensor telemetry..." />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#172033]">ESP32-001</h2>
                      <span className="rounded border border-[#E2E8F0] bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-[#475569]">ESP32 Node</span>
                    </div>
                    <p className="text-xs text-[#64748B]">{primaryDevice?.deviceName || primaryDevice?.deviceType || 'ESP32 DevKit V1'}</p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${connectionTone}`}>
                  {deviceStatus === 'ONLINE' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  {deviceStatus}
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-[#64748B] sm:grid-cols-3">
                <div className="rounded-lg bg-[#F8FAFC] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#475569]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-semibold uppercase tracking-[0.08em]">Location</span>
                  </div>
                  <p className="text-sm font-medium text-[#172033]">{primaryDevice?.location || primaryDevice?.building || 'Unassigned'}</p>
                </div>

                <div className="rounded-lg bg-[#F8FAFC] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#475569]">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="font-semibold uppercase tracking-[0.08em]">Last seen</span>
                  </div>
                  <p className="text-sm font-medium text-[#172033]">{primaryDevice?.lastSeen || formatDateTime(primaryDevice?.lastSeenTimestamp) || 'No telemetry'}</p>
                </div>

                <div className="rounded-lg bg-[#F8FAFC] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#475569]">
                    <Cpu className="h-3.5 w-3.5" />
                    <span className="font-semibold uppercase tracking-[0.08em]">Sensors</span>
                  </div>
                  <p className="text-sm font-medium text-[#172033]">{Array.isArray(primaryDevice?.sensors) ? primaryDevice.sensors.length : 4} active channels</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Telemetry status</h3>
                <span className="text-[10px] text-[#64748B]">Updated {latestReading ? formatTimestamp(latestReading.timestamp || latestReading.createdAt) : '—'}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                  <span>Temperature</span>
                  <span className="font-semibold text-[#172033]">{temperatureValue}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                  <span>Humidity</span>
                  <span className="font-semibold text-[#172033]">{humidityValue}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                  <span>MQ-2 raw ADC</span>
                  <span className="font-semibold text-[#172033]">{gasValue}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                  <span>Flame</span>
                  <span className={`font-semibold ${flameValue === 'Detected' ? 'text-red-600' : 'text-[#172033]'}`}>{flameValue}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                name: 'Flame Sensor',
                value: flameValue,
                unit: '',
                status: latestReading && latestReading.flameDetected ? 'alert' : 'normal',
                threshold: 'Fire trigger',
                icon: Flame,
              },
              {
                name: 'MQ-2 Raw ADC',
                value: gasValue,
                unit: '',
                status: latestReading && getNumeric(latestReading.gasLevel, 0) > Number(settings.gasThreshold || 0) ? 'alert' : 'normal',
                threshold: `>${settings.gasThreshold ?? '—'} ADC`,
                icon: Wind,
              },
              {
                name: 'DHT11',
                value: `${temperatureValue} / ${humidityValue}`,
                unit: '',
                status: latestReading && getNumeric(latestReading.temperature, 0) > Number(settings.temperatureThreshold || 0) ? 'alert' : 'normal',
                threshold: `>${settings.temperatureThreshold ?? '—'}°C`,
                icon: Thermometer,
              },
              {
                name: 'MPU6050',
                value: movementValue,
                unit: '',
                status: latestReading && Math.sqrt((getNumeric(latestReading.accelerationX, 0) || 0) ** 2 + (getNumeric(latestReading.accelerationY, 0) || 0) ** 2 + (getNumeric(latestReading.accelerationZ, 1) || 1) ** 2) > Number(settings.vibrationThreshold || 0) ? 'alert' : 'normal',
                threshold: `>${settings.vibrationThreshold ?? '—'}g`,
                icon: Activity,
              },
            ].map((sensor) => {
              const SensorIcon = sensor.icon;
              const isAlert = sensor.status === 'alert';
              return (
                <div key={sensor.name} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <SensorIcon className="h-4 w-4" />
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${isAlert ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                      {isAlert ? 'Alert' : 'Normal'}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{sensor.name}</p>
                  <p className="mt-2 text-lg font-semibold text-[#172033]">{sensor.value}</p>
                  <p className="mt-1 text-[10px] text-[#64748B]">Threshold: {sensor.threshold}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#172033]">Telemetry history</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {rangeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      range === option
                        ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                    }`}
                  >
                    {option === '10m' ? 'Last 10 min' : option === '1h' ? 'Last hour' : 'Last 24h'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {chartConfig.map((chart) => (
                <ChartCard
                  key={chart.key}
                  title={chart.title}
                  unit={chart.unit}
                  value={chart.value}
                  threshold={chart.threshold}
                  color={chart.color}
                  readings={filteredReadings}
                  sensorKey={chart.sensorKey}
                  emptyMessage="No telemetry history available yet"
                  status={chart.status}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#172033]">Recent IoT incidents</h2>
              </div>
              <Link to="/authority/incidents" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline">
                View details <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {sortedIotIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">No automated sensor incidents are currently available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs text-[#172033]">
                  <thead className="bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    <tr>
                      <th className="px-4 py-3">Incident ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Device ID</th>
                      <th className="px-4 py-3">Reported</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {sortedIotIncidents.slice(0, 6).map((incident) => (
                      <tr key={incident.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-[#172033]">#{incident.id}</td>
                        <td className="px-4 py-3 font-medium text-[#172033]">{incident.disasterType || 'Sensor Event'}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={incident.severity || 'Medium'} size="xs" /></td>
                        <td className="px-4 py-3 font-mono text-[#475569]">{incident.deviceId || 'ESP32-001'}</td>
                        <td className="px-4 py-3 text-[#64748B]">{formatDateTime(incident.reportedAt || incident.createdAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={incident.status || 'PENDING_VERIFICATION'} size="xs" /></td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/authority/incidents/${encodeURIComponent(incident.id)}`}
                            className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#172033] hover:bg-slate-50"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SensorMonitoringPage;
