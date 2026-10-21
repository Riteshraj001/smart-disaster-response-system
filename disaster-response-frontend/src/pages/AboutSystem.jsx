import React from 'react';
import { ArrowRight, Layers, Cpu, Server, Database, Radio, Shield } from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';

const AboutSystem = () => {
  return (
    <div className="min-h-screen bg-white text-[#172033] flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            About the Project
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Smart Disaster Management &amp; Emergency Response System — Architecture and Overview.
          </p>
        </div>

        {/* System Purpose */}
        <section className="rounded border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#172033]">
            1. Project Purpose
          </h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            The Smart Disaster Management &amp; Emergency Response System integrates manual citizen emergency reporting with automated IoT sensor detection. The platform centralizes disaster logs from multiple ingestion vectors into a unified operational dashboard to minimize response delays and enhance public safety.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
              <span className="font-semibold text-[#172033]">Citizen-Based Reporting</span>
              <p className="text-[#64748B]">
                Enables civilians to file immediate incident reports with location coordinates, severity estimation, descriptions, and photographic evidence.
              </p>
            </div>
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
              <span className="font-semibold text-[#172033]">Automated IoT Incident Detection</span>
              <p className="text-[#64748B]">
                ESP32 sensor nodes equipped with Flame, Gas/Smoke (MQ-2), Temperature (DHT11), and Vibration (MPU6050) sensors report threshold violations directly to the backend.
              </p>
            </div>
          </div>
        </section>

        {/* System Architecture */}
        <section className="rounded border border-[#E2E8F0] bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#172033]">
            2. System Architecture Flow
          </h2>
          <p className="text-xs text-[#64748B]">
            Data pipeline from edge sensor nodes to centralized administrative interface:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center">
              <Cpu className="w-5 h-5 mx-auto mb-1 text-[#2563EB]" />
              <span className="font-semibold block text-[#172033]">ESP32 Sensors</span>
              <span className="text-[10px] text-[#64748B]">Flame, MQ-2, DHT11, MPU6050</span>
            </div>
            <div className="hidden sm:flex items-center justify-center text-[#64748B]">
              &rarr; Wi-Fi &rarr;
            </div>
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center">
              <Server className="w-5 h-5 mx-auto mb-1 text-[#2563EB]" />
              <span className="font-semibold block text-[#172033]">Spring Boot REST</span>
              <span className="text-[10px] text-[#64748B]">Port 8080 API</span>
            </div>
            <div className="hidden sm:flex items-center justify-center text-[#64748B]">
              &rarr; JPA &rarr;
            </div>
            <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center">
              <Database className="w-5 h-5 mx-auto mb-1 text-[#2563EB]" />
              <span className="font-semibold block text-[#172033]">MySQL Database</span>
              <span className="text-[10px] text-[#64748B]">Incident Storage</span>
            </div>
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Academic Prototype Notice:</p>
            <p className="text-[11px] leading-relaxed">
              This system is an academic engineering prototype. Sensor readings and automated alerts require environmental calibration and manual verification before dispatching field emergency units. It does not replace official national emergency helpline services (112).
            </p>
          </div>
        </section>

        {/* Spring Boot REST API Integration */}
        <section className="rounded border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#172033]">
            3. Spring Boot REST API Specification
          </h2>
          <div className="overflow-x-auto rounded border border-[#E2E8F0]">
            <table className="w-full text-left text-xs text-[#172033]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#2563EB]">GET</td>
                  <td className="py-2 px-3 font-mono">/incidents</td>
                  <td className="py-2 px-3 text-[#64748B]">Retrieve all incidents from MySQL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#059669]">POST</td>
                  <td className="py-2 px-3 font-mono">/incidents</td>
                  <td className="py-2 px-3 text-[#64748B]">Create incident from citizen report or ESP32 node</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#2563EB]">GET</td>
                  <td className="py-2 px-3 font-mono">/incidents/{'{id}'}</td>
                  <td className="py-2 px-3 text-[#64748B]">Retrieve details for a specific incident</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#D97706]">PATCH</td>
                  <td className="py-2 px-3 font-mono">/incidents/{'{id}'}/status</td>
                  <td className="py-2 px-3 text-[#64748B]">Update status or assigned team</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-[#E2E8F0] bg-white py-4 px-4 text-xs text-[#64748B]">
        <div className="mx-auto max-w-[1100px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Disaster Management &amp; Emergency Response System</span>
          <span className="text-slate-500">Public Safety Service</span>
        </div>
      </footer>
    </div>
  );
};

export default AboutSystem;
