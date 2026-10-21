import React from 'react';

const variantStyles = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB]/30 border-transparent',
  secondary: 'bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] focus:ring-slate-300',
  outline: 'bg-transparent text-[#2563EB] border-[#2563EB] hover:bg-blue-50 focus:ring-blue-300',
  danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]/30 border-transparent',
  success: 'bg-[#059669] text-white hover:bg-[#047857] focus:ring-[#059669]/30 border-transparent',
  ghost: 'bg-transparent text-[#64748B] hover:text-[#172033] hover:bg-slate-100 border-transparent focus:ring-slate-200',
};

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-4 py-2.5 text-base gap-2.5',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variantClass = variantStyles[variant] || variantStyles.primary;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
