import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled = false,
  ...props 
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold 
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-95
  `;
  
  const variants = {
    primary: `
      bg-primary-600 text-white 
      hover:bg-primary-700 active:bg-primary-800
      focus:ring-primary-500 
      shadow-md hover:shadow-lg
      dark:bg-primary-500 dark:hover:bg-primary-600
    `,
    secondary: `
      bg-neutral-600 text-white 
      hover:bg-neutral-700 active:bg-neutral-800
      focus:ring-neutral-500 
      shadow-md hover:shadow-lg
      dark:bg-neutral-700 dark:hover:bg-neutral-600
    `,
    success: `
      bg-success-600 text-white 
      hover:bg-success-700 active:bg-success-800
      focus:ring-success-500 
      shadow-md hover:shadow-lg
    `,
    danger: `
      bg-danger-600 text-white 
      hover:bg-danger-700 active:bg-danger-800
      focus:ring-danger-500 
      shadow-md hover:shadow-lg
    `,
    warning: `
      bg-warning-500 text-white 
      hover:bg-warning-600 active:bg-warning-700
      focus:ring-warning-500 
      shadow-md hover:shadow-lg
    `,
    ghost: `
      bg-transparent text-neutral-700 
      hover:bg-neutral-100 active:bg-neutral-200
      focus:ring-neutral-400
      dark:text-neutral-300 dark:hover:bg-neutral-800
    `,
    outline: `
      bg-transparent border-2 border-neutral-300 text-neutral-700 
      hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100
      focus:ring-neutral-400
      dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800
    `,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2.5 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      ref={ref}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
