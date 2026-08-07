import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  iconOnly?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading,
  iconOnly,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
    dark:    'bg-primary-900 text-white hover:bg-primary-800',
    outline: 'bg-surface border border-accent-300 text-accent-700 hover:bg-accent-50 hover:border-accent-400',
    ghost:   'bg-transparent text-accent-600 hover:bg-accent-100 hover:text-accent-800',
    danger:  'text-danger hover:bg-red-50',
  };

  const sizes = {
    xs: 'px-2 py-1 text-[10px] rounded-sm gap-1',
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
  };

  const iconPadding = iconOnly ? {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5',
  } : {};

  const appliedSize = iconOnly ? (iconPadding[size as keyof typeof iconPadding] || sizes[size]) : sizes[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${appliedSize} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
