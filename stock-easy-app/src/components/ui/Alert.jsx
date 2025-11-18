import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const Alert = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200',
    destructive: 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900 dark:border-danger-800 dark:text-danger-200',
    success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900 dark:border-success-800 dark:text-success-200',
    warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900 dark:border-warning-800 dark:text-warning-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-200',
  };

  const icons = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[variant] || Info;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

const AlertTitle = ({ children, className = '', ...props }) => (
  <h5
    className={`
      font-semibold mb-1
      ${className}
    `}
    {...props}
  >
    {children}
  </h5>
);

const AlertDescription = ({ children, className = '', ...props }) => (
  <div
    className={`
      text-sm
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

export { Alert, AlertTitle, AlertDescription };

