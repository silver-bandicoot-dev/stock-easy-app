import React, { useState } from 'react';
import { Info } from 'lucide-react';

export const InfoTooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 text-[#666663] hover:text-[#191919] transition-colors"
      >
        <Info className="w-3 h-3" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#191919] text-white text-xs rounded-lg shadow-lg z-50 max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#191919]"></div>
        </div>
      )}
    </div>
  );
};

