/**
 * UI presentation module for badge within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/badge
 * @exports BadgeVariant, BadgeProps, Badge
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Type alias representing badge variant.
 */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'gold'
  | 'gold-glow'
  | 'approved'
  | 'pending'
  | 'warning'
  | 'locked'
  | 'unlocked'
  | 'destructive'
  | 'danger'
  | 'outline';

/**
 * Type contract defining badge props.
 * Includes fields/members: variant.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F8FAFC] text-[#082233] border-[#E2E8F0]',
  primary: 'bg-[#006C9C]/10 text-[#006C9C] border-[#006C9C]/25',
  secondary: 'bg-[#1C7890]/10 text-[#145B6E] border-[#1C7890]/25',
  gold: 'bg-[#BC9C5C]/15 text-[#6B4E16] border-[#BC9C5C]/40',
  'gold-glow': 'bg-[#BC9C5C]/25 text-[#FDF4D4] border-[#D8BC7C]/70 shadow-sm font-semibold',
  approved: 'bg-[#0D7A5F]/10 text-[#0D7A5F] border-[#0D7A5F]/30',
  unlocked: 'bg-[#0D7A5F]/10 text-[#0D7A5F] border-[#0D7A5F]/30',
  pending: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  warning: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  locked: 'bg-slate-200 text-slate-700 border-slate-300',
  destructive: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
  danger: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
  outline: 'bg-transparent text-[#5F7383] border-[#CBD5E1]',
};

/**
 * Constant definition for badge.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.015em] transition-colors',
          badgeVariantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
