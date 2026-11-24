'use client';

/**
 * Module architecture and API reference for `src/components/ui/input.tsx`.
 *
 * Exported symbols:
 * - `InputProps` (Interface): input props definition.
 * - `Input` (Const): input definition.
 *
 * Internal dependencies:
 * - `@/lib/utils`
 *
 * @module components/ui/input
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for input within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/input
 * @exports InputProps, Input
 */

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Type contract defining input props.
 * Includes fields/members: error, label.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

/**
 * Constant definition for input.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#082233]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={resolvedType}
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              'flex h-[44px] w-full rounded-[10px] border bg-white px-[14px] py-2 text-base text-[#082233] placeholder:text-[#5F7383] transition-colors',
              'outline-transparent focus-visible:outline-none focus:border-[#006C9C] focus:ring-2 focus:ring-[#006C9C]/15 focus-visible:border-[#006C9C] focus-visible:ring-2 focus-visible:ring-[#006C9C]/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isPassword && 'pr-11',
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] ring-2 ring-[#DC2626]/15'
                : 'border-[#CBD5E1]',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[#5F7383] hover:text-[#082233] hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] touch-manipulation"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-xs font-medium text-[#DC2626]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
