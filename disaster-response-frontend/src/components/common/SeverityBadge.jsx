import React from 'react';
import { SEVERITY_CONFIG } from '../../constants/incidentConstants';

const SeverityBadge = ({ severity = 'Medium', size = 'md', showDot = true }) => {
  const raw = (severity || '').trim().toLowerCase();

  let key = 'Medium';
  if (raw.includes('crit')) key = 'Critical';
  else if (raw.includes('high')) key = 'High';
  else if (raw.includes('low')) key = 'Low';
  else if (raw.includes('med')) key = 'Medium';

  const config = SEVERITY_CONFIG[key] || SEVERITY_CONFIG.Medium;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1.5'
      : size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold gap-2'
      : 'px-2.5 py-0.5 text-xs font-medium gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses}`}
      title={`Severity: ${config.label} — ${config.description}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotBg} shrink-0`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default SeverityBadge;

