import apiClient from '../api/client';
import { IOT_DEVICES, DEFAULT_IOT_SETTINGS } from '../constants/incidentConstants';

const LOCAL_STORAGE_IOT_SETTINGS_KEY = 'smart_disaster_iot_settings';
const LOCAL_STORAGE_IOT_DEVICES_KEY = 'smart_disaster_iot_devices';
const LOCAL_STORAGE_IOT_READINGS_KEY = 'smart_disaster_iot_readings';

export const iotService = {
  /**
   * Get all registered IoT sensor devices
   */
  async getSensors() {
    try {
      const response = await apiClient.get('/api/iot/sensors');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      // Return local/cached devices when backend is offline
    }
    return this.getLocalDevices();
  },

  /**
   * Get single sensor device by deviceId
   */
  async getSensorById(deviceId) {
    try {
      const response = await apiClient.get(`/api/iot/sensors/${deviceId}`);
      if (response.data) return response.data;
    } catch (err) {
      // Fallback
    }
    const devices = this.getLocalDevices();
    return devices.find((d) => d.deviceId === deviceId) || null;
  },

  /**
   * Get recent readings for a specific device
   */
  async getReadings(deviceId) {
    try {
      const response = await apiClient.get(`/api/iot/readings/${deviceId}`);
      if (response.data && Array.isArray(response.data)) return response.data;
    } catch (err) {
      // Fallback
    }
    return this.getLocalReadings(deviceId);
  },

  /**
   * Send sensor data payload (simulated from UI or sent by ESP32)
   * POST /api/iot/sensor-data
   */
  async sendSensorData(reading) {
    let result = null;
    try {
      const response = await apiClient.post('/api/iot/sensor-data', reading);
      result = response.data;
    } catch (err) {
      // Local fallback simulation
      result = this.processLocalSensorReading(reading);
    }
    return result;
  },

  /**
   * Get IoT threshold & cooldown settings
   */
  async getSettings() {
    try {
      const response = await apiClient.get('/api/iot/settings');
      if (response.data) return response.data;
    } catch (err) {
      // Fallback
    }
    return this.getLocalSettings();
  },

  /**
   * Update IoT threshold & cooldown settings
   */
  async updateSettings(settings) {
    try {
      const response = await apiClient.put('/api/iot/settings', settings);
      if (response.data) {
        this.saveLocalSettings(response.data);
        return response.data;
      }
    } catch (err) {
      // Fallback
    }
    this.saveLocalSettings(settings);
    return settings;
  },

  /* Local persistence helpers for resilient offline demonstrations */
  getLocalSettings() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_IOT_SETTINGS_KEY);
      return data ? { ...DEFAULT_IOT_SETTINGS, ...JSON.parse(data) } : DEFAULT_IOT_SETTINGS;
    } catch {
      return DEFAULT_IOT_SETTINGS;
    }
  },

  saveLocalSettings(settings) {
    try {
      localStorage.setItem(LOCAL_STORAGE_IOT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save IoT settings locally', e);
    }
  },

  getLocalDevices() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_IOT_DEVICES_KEY);
      return data ? JSON.parse(data) : IOT_DEVICES;
    } catch {
      return IOT_DEVICES;
    }
  },

  saveLocalDevices(devices) {
    try {
      localStorage.setItem(LOCAL_STORAGE_IOT_DEVICES_KEY, JSON.stringify(devices));
    } catch (e) {
      console.warn('Could not save devices locally', e);
    }
  },

  getLocalReadings(deviceId) {
    try {
      const data = localStorage.getItem(`${LOCAL_STORAGE_IOT_READINGS_KEY}_${deviceId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  processLocalSensorReading(reading) {
    const devices = this.getLocalDevices();
    const settings = this.getLocalSettings();
    const now = Date.now();

    const deviceIndex = devices.findIndex((d) => d.deviceId === reading.deviceId);
    const updatedDevice = {
      deviceId: reading.deviceId,
      deviceType: 'ESP32 DevKit V1 Multi-Sensor Unit',
      location: reading.location || 'Academic Block A',
      status: 'ONLINE',
      lastSeen: 'Just now',
      lastSeenTimestamp: now,
      sensors: [
        {
          name: 'Flame Sensor (IR)',
          type: 'Optical Flame',
          currentReading: reading.flameDetected ? 'FLAME DETECTED' : 'NORMAL (No Flame)',
          threshold: 'Flame Detected',
          status: reading.flameDetected ? 'ALERT' : 'NORMAL',
        },
        {
          name: 'MQ-2 Sensor',
          type: 'Gas & Smoke',
          currentReading: `${reading.gasLevel || 120} PPM`,
          threshold: `${settings.gasThreshold} PPM`,
          status: (reading.gasLevel || 0) > settings.gasThreshold ? 'ALERT' : 'NORMAL',
        },
        {
          name: 'DHT11 Sensor',
          type: 'Temperature & Humidity',
          currentReading: `${reading.temperature || 25}°C / ${reading.humidity || 50}% RH`,
          threshold: `${settings.temperatureThreshold}°C`,
          status: (reading.temperature || 0) > settings.temperatureThreshold ? 'ALERT' : 'NORMAL',
        },
        {
          name: 'MPU6050 Sensor',
          type: 'Accelerometer / Vibration',
          currentReading: `${(Math.sqrt((reading.accelerationX||0)**2 + (reading.accelerationY||0)**2 + (reading.accelerationZ||1)**2)).toFixed(2)}g`,
          threshold: `${settings.vibrationThreshold}g`,
          status: Math.sqrt((reading.accelerationX||0)**2 + (reading.accelerationY||0)**2 + (reading.accelerationZ||1)**2) > settings.vibrationThreshold ? 'ALERT' : 'NORMAL',
        },
      ],
    };

    if (deviceIndex >= 0) {
      devices[deviceIndex] = updatedDevice;
    } else {
      devices.push(updatedDevice);
    }
    this.saveLocalDevices(devices);

    return { success: true, message: 'Sensor data ingested successfully.' };
  },
};

export default iotService;
