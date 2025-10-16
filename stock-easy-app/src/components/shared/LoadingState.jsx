import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Chargement...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      <p className="text-neutral-600 dark:text-neutral-400 font-medium">
        {message}
      </p>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      {content}
    </div>
  );
};

export default LoadingState;
