import React from 'react';
import { Button } from '../ui/Button';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="w-16 h-16 text-neutral-400 dark:text-neutral-600" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
