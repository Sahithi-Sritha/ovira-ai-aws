import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export function Card({
    children,
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-surface border border-border',
        elevated: 'bg-surface shadow-lg shadow-black/5',
        outlined: 'bg-transparent border-2 border-border',
        gradient: 'bg-gradient-to-br from-primary/10 via-surface to-accent/10 border border-border',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(
                'rounded-2xl transition-all duration-200',
                variants[variant],
                paddings[padding],
                hover && 'hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <div
            className={cn('flex flex-col space-y-1.5', className)}
            {...props}
        >
            {children}
        </div>
    );
}

// Card Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

export function CardTitle({ children, className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn(
                'text-xl font-semibold text-text-primary tracking-tight',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

// Card Description
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
    return (
        <p
            className={cn('text-sm text-text-secondary', className)}
            {...props}
        >
            {children}
        </p>
    );
}

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardContent({ children, className, ...props }: CardContentProps) {
    return (
        <div className={cn('pt-4', className)} {...props}>
            {children}
        </div>
    );
}

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardFooter({ children, className, ...props }: CardFooterProps) {
    return (
        <div
            className={cn('flex items-center pt-4', className)}
            {...props}
        >
            {children}
        </div>
    );
}
