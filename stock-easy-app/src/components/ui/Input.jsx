import React from 'react';

export const Input = React.forwardRef(({ 
  label, 
  error,
  icon: Icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
