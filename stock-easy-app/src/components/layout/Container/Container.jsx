import React from 'react';

const Container = ({ children, className = '', maxWidth = 'xl', ...props }) => {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };
  
  return (
    <div 
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidths[maxWidth]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
