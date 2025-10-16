import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ 
  message = 'Chargement...', 
  fullScreen = false,
  size = 'md' 
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className={`${sizes[size]} animate-spin text-primary-600 dark:text-primary-400`} />
      <p className="text-neutral-600 dark:text-neutral-400 font-medium">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        {content}
      </div>
    );
  }

  return (
    <div className="py-12">
      {content}
    </div>
  );
};

export default LoadingState;
