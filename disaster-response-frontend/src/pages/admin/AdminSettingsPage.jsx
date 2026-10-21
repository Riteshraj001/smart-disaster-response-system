import React, { useState, useEffect } from 'react';
import { Settings, Save, Server, Cpu, Flame, Wind, Thermometer, Zap, Clock, CheckCircle2 } from 'lucide-react';
import iotService from '../../services/iotService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSettingsPage = () => {
  const { showToast } = useNotification();
  const [settings, setSettings] = useState({
    gasThreshold: 400,
    temperatureThreshold: 40.0,
    vibrationThreshold: 1.5,
    flameDetectionEnabled: true,
    cooldownSeconds: 60,
    offlineTimeoutSeconds: 45,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await iotService.getSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await iotService.updateSettings(settings);
      showToast('IoT sensor thresholds and cooldown configuration updated successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading system settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="pb-2 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-bold text-[#172033]">
          IoT Sensor Threshold &amp; System Configuration
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Calibrate dynamic trigger limits for ESP32 nodes and configure automated incident deduplication rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sensor Thresholds Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Cpu className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172033]">Hardware Sensor Threshold Calibration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* MQ-2 Gas / Smoke */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-600" />
                <label className="text-xs font-bold text-[#172033] uppercase">
                  MQ-2 Gas / Smoke Threshold (PPM)
                </label>
              </div>
              <input
                type="number"
                min="50"
                max="2000"
                step="10"
                value={settings.gasThreshold}
                onChange={(e) => setSettings({ ...settings, gasThreshold: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#172033] focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-[11px] text-[#64748B]">
                Readings exceeding this PPM trigger an automated <strong>GAS_LEAK</strong> or <strong>SMOKE</strong> incident.
              </p>
            </div>

            {/* DHT11 Temperature */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#DC2626]" />
                <label className="text-xs font-bold text-[#172033] uppercase">
                  DHT11 Temperature Threshold (°C)
                </label>
              </div>
              <input
                type="number"
                min="20"
                max="80"
                step="0.5"
                value={settings.temperatureThreshold}
                onChange={(e) => setSettings({ ...settings, temperatureThreshold: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#172033] focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-[11px] text-[#64748B]">
                Thermal readings above this trigger an <strong>EXTREME_TEMPERATURE</strong> incident.
              </p>
            </div>

            {/* MPU6050 Vibration */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <label className="text-xs font-bold text-[#172033] uppercase">
                  MPU6050 Vibration Threshold (g)
                </label>
              </div>
              <input
                type="number"
                min="1.0"
                max="5.0"
                step="0.1"
                value={settings.vibrationThreshold}
                onChange={(e) => setSettings({ ...settings, vibrationThreshold: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#172033] focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-[11px] text-[#64748B]">
                Total acceleration deviation above this triggers <strong>STRUCTURAL_VIBRATION</strong> incident.
              </p>
            </div>

            {/* Flame Detection Enable */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#DC2626]" />
                  <label className="text-xs font-bold text-[#172033] uppercase">
                    Optical Flame Detection (IR)
                  </label>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  When enabled, any optical flame signal instantly creates a <strong>FIRE (HIGH SEVERITY)</strong> incident.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={settings.flameDetectionEnabled}
                  onChange={(e) => setSettings({ ...settings, flameDetectionEnabled: e.target.checked })}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs font-bold text-[#172033]">Enable Instant Flame Trigger</span>
              </label>
            </div>
          </div>
        </div>

        {/* Deduplication & Cooldown Policy Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#172033]">Incident Deduplication &amp; Heartbeat Cooldown</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-[#172033]">
                Duplicate Alarm Cooldown (Seconds)
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={settings.cooldownSeconds}
                onChange={(e) => setSettings({ ...settings, cooldownSeconds: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#172033] focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-[11px] text-[#64748B]">
                Prevents repeated sensor readings from creating duplicate incidents within this duration (Default: 60s).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-[#172033]">
                Device Offline Timeout (Seconds)
              </label>
              <input
                type="number"
                min="15"
                max="300"
                value={settings.offlineTimeoutSeconds}
                onChange={(e) => setSettings({ ...settings, offlineTimeoutSeconds: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs font-bold text-[#172033] focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-[11px] text-[#64748B]">
                ESP32 nodes with no telemetry for this interval transition to <strong>OFFLINE</strong> status.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
