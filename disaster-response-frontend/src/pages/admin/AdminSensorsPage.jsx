import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  RefreshCw,
  PlusCircle,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
} from 'lucide-react';
import iotService from '../../services/iotService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSensorsPage = () => {
  const { showToast } = useNotification();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Device Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: 'ESP32-004',
    deviceType: 'ESP32 DevKit V1 Multi-Sensor Unit',
    location: 'Auditorium Complex - Main Hall',
  });

  const fetchDevices = useCallback(async () => {
    try {
      const data = await iotService.getSensors();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load devices', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRegisterDevice = (e) => {
    e.preventDefault();
    const createdDevice = {
      ...newDevice,
      status: 'ONLINE',
      lastSeen: 'Just registered',
      lastSeenTimestamp: Date.now(),
      sensors: [
        { name: 'Flame Sensor (IR)', type: 'Optical Flame', currentReading: 'NORMAL (No Flame)', threshold: 'Flame Detected', status: 'NORMAL' },
        { name: 'MQ-2 Sensor', type: 'Gas & Smoke', currentReading: '110 PPM', threshold: '400 PPM', status: 'NORMAL' },
        { name: 'DHT11 Sensor', type: 'Temperature & Humidity', currentReading: '26.0°C / 50% RH', threshold: '40.0°C', status: 'NORMAL' },
        { name: 'MPU6050 Sensor', type: 'Accelerometer / Vibration', currentReading: '1.00g (Stable)', threshold: '1.50g', status: 'NORMAL' },
      ],
    };

    const nextList = [...devices, createdDevice];
    setDevices(nextList);
    iotService.saveLocalDevices(nextList);
    showToast(`Device ${newDevice.deviceId} registered successfully.`, 'success');
    setIsModalOpen(false);
  };

  const handleDeleteDevice = (deviceId) => {
    if (!window.confirm(`Unregister device ${deviceId}?`)) return;
    const nextList = devices.filter((d) => d.deviceId !== deviceId);
    setDevices(nextList);
    iotService.saveLocalDevices(nextList);
    showToast(`Device ${deviceId} removed from registry.`, 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">
            IoT Device Registry &amp; Sensor Calibration
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage deployed ESP32 nodes, calibrate sensors, and inspect network telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              fetchDevices();
            }}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#172033] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Registry'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register New ESP32 Node</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading device registry..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const isOnline = device.status === 'ONLINE';
            return (
              <div
                key={device.deviceId}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4 hover:border-[#2563EB]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#172033]">{device.deviceId}</h3>
                        <span className="text-[10px] text-[#64748B] block">{device.deviceType}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOnline
                          ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#059669] animate-pulse' : 'bg-slate-400'}`} />
                      {device.status}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="font-semibold text-[#172033]">{device.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                      <Clock className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span>Last Seen: {device.lastSeen || 'Recently'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Connected Sensors
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {(device.sensors || []).map((s) => (
                        <div key={s.name} className="p-2 rounded-lg bg-slate-50 border border-[#E2E8F0]">
                          <span className="block font-bold text-[#172033] truncate">{s.name}</span>
                          <span className="block text-[10px] text-[#2563EB] font-semibold">{s.currentReading}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">HTTP REST Node</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDevice(device.deviceId)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Node Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleRegisterDevice}
            className="bg-white rounded-xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172033]">Register New ESP32 Sensor Node</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Device Node Identifier (e.g. ESP32-004)
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2 text-xs font-bold text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Hardware Model
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.deviceType}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2 text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Installation Location / Landmark
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2 text-xs text-[#172033]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-bold text-white shadow-xs"
              >
                Register Device
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminSensorsPage;
