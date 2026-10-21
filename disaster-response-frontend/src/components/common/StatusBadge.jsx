import React from 'react';
import { STATUS_CONFIG } from '../../constants/incidentConstants';

export const StatusBadge = ({ status, size = 'md' }) => {
  const rawStatus = (status || '').trim();
  const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG[rawStatus.toUpperCase()] || STATUS_CONFIG.PENDING_VERIFICATION;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold gap-2'
      : 'px-2.5 py-0.5 text-xs font-medium gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses}`}
      title={config.description}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotBg} shrink-0`} />
      <span>{config.displayLabel || config.label}</span>
    </span>
  );
};

export default StatusBadge;

