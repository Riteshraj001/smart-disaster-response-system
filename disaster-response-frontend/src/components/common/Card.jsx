import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-[#172033]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-5'} ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs text-[#64748B] ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
