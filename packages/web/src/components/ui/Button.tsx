'use client';
import { cn } from '@/lib/formatters';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-accent-purple hover:bg-accent-purple/80 text-white',
  secondary: 'bg-bg-tertiary hover:bg-bg-surface text-text-primary border border-border',
  ghost: 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary',
  danger: 'bg-accent-red hover:bg-accent-red/80 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn('rounded-lg font-medium transition-fast disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
