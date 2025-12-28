'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium 
    rounded-xl transition-all duration-200 ease-out
    focus-ring disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

    const variants = {
        primary: `
      bg-primary text-white
      hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25
    `,
        secondary: `
      bg-secondary text-white
      hover:bg-secondary-light hover:shadow-lg hover:shadow-secondary/25
    `,
        outline: `
      border-2 border-primary text-primary bg-transparent
      hover:bg-primary hover:text-white
    `,
        ghost: `
      bg-transparent text-text-primary
      hover:bg-surface-elevated
    `,
        danger: `
      bg-error text-white
      hover:bg-red-600 hover:shadow-lg hover:shadow-error/25
    `,
    };

    const sizes = {
        sm: 'text-sm px-4 py-2',
        md: 'text-base px-6 py-3',
        lg: 'text-lg px-8 py-4',
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : (
                leftIcon
            )}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
}
