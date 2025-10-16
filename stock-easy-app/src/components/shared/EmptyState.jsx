import React from 'react';
import { Button } from '../ui/Button';

const EmptyState = ({ 
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  ...props 
}) => {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8" {...props}>
      <div className="max-w-md text-center space-y-4">
        {Icon && (
          <div className="mx-auto w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
          </div>
        )}
        
        {title && (
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
        )}
        
        {description && (
          <p className="text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        )}
        
        {action && actionLabel && (
          <Button onClick={action} variant="primary">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
