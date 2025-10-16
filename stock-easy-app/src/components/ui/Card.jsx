import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  padding = 'default',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div
      className={`
        bg-white dark:bg-neutral-800
        rounded-xl 
        shadow-sm 
        border border-neutral-200 dark:border-neutral-700
        transition-all duration-200
        ${hoverable ? 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3
    className={`text-xl font-bold text-neutral-900 dark:text-neutral-100 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p
    className={`text-sm text-neutral-600 dark:text-neutral-400 ${className}`}
    {...props}
  >
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
