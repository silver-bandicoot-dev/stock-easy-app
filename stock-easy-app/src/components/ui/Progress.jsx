import React from 'react';

const Progress = ({ 
  value = 0, 
  max = 100,
  className = '',
  ...props 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={`
        w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden
        ${className}
      `}
      {...props}
    >
      <div
        className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export { Progress };

