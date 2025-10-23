import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Composant Button unifié et réutilisable
 * Extrait de StockEasy.jsx
 */
export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-[#333333] focus:ring-black shadow-lg',
    secondary: 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663] focus:ring-[#40403E]',
    ghost: 'bg-transparent text-black hover:bg-black/10 focus:ring-black',
    danger: 'bg-[#EF1C43] text-white hover:bg-red-700 focus:ring-[#EF1C43] shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 shadow-sm',
    outline: 'bg-transparent border-2 border-[#E5E4DF] text-[#191919] hover:bg-[#FAFAF7] focus:ring-black',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <RefreshCw className="w-4 h-4 shrink-0 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};
