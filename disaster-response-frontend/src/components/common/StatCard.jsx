import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const variantStyles = {
  default: {
    border: 'border-[#E2E8F0]',
    iconBg: 'bg-[#F8FAFC] text-[#172033]',
    valueColor: 'text-[#172033]',
  },
  active: {
    border: 'border-red-200',
    iconBg: 'bg-red-50 text-[#DC2626]',
    valueColor: 'text-[#DC2626]',
  },
  pending: {
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-[#D97706]',
    valueColor: 'text-[#D97706]',
  },
  resolved: {
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-[#059669]',
    valueColor: 'text-[#059669]',
  },
  primary: {
    border: 'border-blue-200',
    iconBg: 'bg-blue-50 text-[#2563EB]',
    valueColor: 'text-[#2563EB]',
  },
  danger: {
    border: 'border-red-200',
    iconBg: 'bg-red-50 text-[#DC2626]',
    valueColor: 'text-[#DC2626]',
  },
  warning: {
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-[#D97706]',
    valueColor: 'text-[#D97706]',
  },
  success: {
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-[#059669]',
    valueColor: 'text-[#059669]',
  },
};

export const StatCard = ({
  title,
  value = 0,
  icon: Icon,
  variant = 'default',
  subtitle,
  onClick,
  active = false,
  badgeText,
  className = '',
}) => {
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg bg-white p-5 border shadow-xs transition-all duration-150 ${
        active ? 'ring-2 ring-[#2563EB] border-[#2563EB]' : style.border
      } ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                {badgeText}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${style.valueColor}`}>
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-md shrink-0 ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#E2E8F0] text-xs text-[#64748B]">
          <span>{subtitle}</span>
          {onClick && (
            <span className="flex items-center text-[#2563EB] font-medium hover:underline">
              Filter <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
