import React from 'react';
import { User, Cpu } from 'lucide-react';

export const SourceBadge = ({ source = 'CITIZEN', size = 'md' }) => {
  const isSensor =
    typeof source === 'string' &&
    (source.toUpperCase().includes('SENSOR') ||
      source.toUpperCase().includes('IOT') ||
      source.toUpperCase().includes('AUTO'));

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold gap-2'
      : 'px-2.5 py-0.5 text-xs font-medium gap-1.5';

  if (isSensor) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-[#2563EB] font-medium ${sizeClasses}`}
        title="Detected automatically via IoT sensor network"
      >
        <Cpu className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
        <span>IoT Sensor</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#172033] font-medium ${sizeClasses}`}
      title="Reported manually by citizen in field"
    >
      <User className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
      <span>Citizen Report</span>
    </span>
  );
};

export default SourceBadge;


