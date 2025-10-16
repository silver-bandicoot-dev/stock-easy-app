import React, { useState } from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ content, className = '' }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        aria-label="Plus d'informations"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {show && (
        <div className="absolute left-0 top-6 w-72 bg-neutral-900 dark:bg-neutral-800 text-white text-xs rounded-lg p-3 shadow-xl border border-neutral-700 z-[100] animate-fade-in">
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-neutral-900 dark:border-b-neutral-800" />
          {content}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
