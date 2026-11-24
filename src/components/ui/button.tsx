/**
 * UI presentation module for button within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/button
 * @exports ButtonVariant, ButtonSize, ButtonProps, buttonVariants, Button
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Type alias representing button variant.
 */
export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'ghost';

/**
 * Type alias representing button size.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Type contract defining button props.
 * Includes fields/members: variant, size.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#006C9C] hover:bg-[#005072] text-white shadow-sm focus-visible:ring-[#006C9C]',
  accent:
    'bg-gradient-to-br from-[#BC9C5C] to-[#D8BC7C] hover:brightness-95 text-[#082233] shadow-[0_2px_8px_rgba(188,156,92,0.25)] focus-visible:ring-[#BC9C5C]',
  secondary:
    'bg-[#1C7890] hover:bg-[#005072] text-white shadow-sm focus-visible:ring-[#1C7890]',
  outline:
    'bg-white border border-[#CBD5E1] text-[#006C9C] hover:bg-[#F8FAFC] hover:border-[#006C9C] focus-visible:ring-[#006C9C]',
  destructive:
    'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm focus-visible:ring-[#DC2626]',
  ghost:
    'bg-transparent text-[#082233] hover:bg-[#F8FAFC] focus-visible:ring-[#006C9C]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-[44px] min-h-[44px] px-3.5 text-sm rounded-[10px]',
  md: 'h-[44px] min-h-[44px] px-5 text-sm rounded-[10px]',
  lg: 'h-[48px] min-h-[44px] px-6 text-base rounded-[10px]',
};

/**
 * Executes button variants logic.
 * @param props - Destructured input containing variant, size, className.
 */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-semibold select-none',
    'active:scale-[0.96] transition-transform duration-100 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

/**
 * Constant definition for button.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
