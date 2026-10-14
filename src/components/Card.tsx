import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              ) : (
                title
              )
            )}
            {subtitle && (
              typeof subtitle === 'string' ? (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              ) : (
                subtitle
              )
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
