/**
 * UI presentation module for card within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/card
 * @exports CardProps, Card, CardHeader, CardTitle, CardDescription, CardContent
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Type contract defining card props.
 * Includes fields/members: faceted.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  faceted?: boolean;
}

/**
 * Constant definition for card.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, faceted = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-faceted={faceted ? 'true' : 'false'}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] text-[#082233] shadow-sm p-2',
          faceted && 'faceted-poly-accent',
          className
        )}
        {...props}
      >
        {faceted && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rotate-12 bg-gradient-to-br from-[#006C9C]/10 via-[#1C7890]/10 to-[#BC9C5C]/20"
            style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
          />
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/**
 * Constant definition for card header.
 */
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

/**
 * Constant definition for card title.
 */
export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-snug tracking-tight text-[#082233]', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Constant definition for card description.
 */
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-[#5F7383]', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/**
 * Constant definition for card content.
 */
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * Constant definition for card inner.
 */
export const CardInner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]/80 p-3', className)}
    {...props}
  />
));
CardInner.displayName = 'CardInner';

/**
 * Constant definition for card footer.
 */
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0 rounded-lg', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
