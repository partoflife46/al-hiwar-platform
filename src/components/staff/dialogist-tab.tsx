/**
 * Dialogist staff workspace orchestrating queue, live specialist chat, and Shahadah review.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/staff/dialogist-tab.tsx`.
 *
 * Exported symbols:
 * - `DialogistTab` (Function): dialogist tab definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `./dialogist-queue-panel`
 * - `./dialogist-chat-panel`
 * - `./dialogist-shahadah-queue`
 *
 * @module components/staff/dialogist-tab
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { DialogistQueuePanel } from './dialogist-queue-panel';
import { DialogistChatPanel } from './dialogist-chat-panel';
import { DialogistShahadahQueue } from './dialogist-shahadah-queue';

/** Renders the Dialogist live consultation queue, chat room, and Shahadah review tab. */
export function DialogistTab({ ctx }: { ctx: StaffPortalContext }) {
  if (ctx.effectiveTab !== 'DIALOGIST') return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <DialogistQueuePanel ctx={ctx} />
      <div className="lg:col-span-8 space-y-4">
        <DialogistChatPanel ctx={ctx} />
        <DialogistShahadahQueue ctx={ctx} />
      </div>
    </div>
  );
}
