/**
 * Left-hand consultation queue and quick-reply template drafting form for Dialogists.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/dialogist-queue-panel.tsx`.
 *
 * Exported symbols:
 * - `DialogistQueuePanel` (Function): dialogist queue panel definition.
 *
 * Internal dependencies:
 * - `@/lib/services/chat-service`
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./dialogist-copy`
 *
 * @module components/staff/dialogist-queue-panel
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import { chatService } from '@/lib/services/chat-service';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import type { PredefinedMessageCategory } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquareOff, PlusCircle, RefreshCw } from 'lucide-react';
import { DIALOGIST_COPY } from './dialogist-copy';

/** Renders the consultation queue list and quick-reply drafting card for Dialogists. */
export function DialogistQueuePanel({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    conversations,
    selectedConvId,
    setSelectedConvId,
    isAuditOnly,
    refreshData,
    handleClaimConversation,
    draftShortcut,
    setDraftShortcut,
    draftCategory,
    setDraftCategory,
    draftBodyEn,
    setDraftBodyEn,
    draftBodyFr,
    setDraftBodyFr,
    handleCreateTemplateDraft,
  } = ctx;

  const copy = DIALOGIST_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="lg:col-span-4 space-y-4">
      <Card className="p-5 rounded-2xl border border-[#E2E8F0] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#006C9C]">
            {copy.queueTitle} (
            <span className="tabular-nums">{conversations.length}</span>)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            aria-label={copy.refreshAria}
            title={copy.refreshTitle}
            className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:h-8 px-2.5 text-xs touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-2.5">
          {conversations.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] space-y-2">
              <MessageSquareOff
                className="w-7 h-7 mx-auto text-[#5F7383]/60"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-[#082233]">
                {copy.emptyQueueTitle}
              </p>
              <p className="text-[11px] text-[#5F7383]">{copy.emptyQueueDesc}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="text-xs mt-1"
              >
                <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
                {copy.refreshQueueBtn}
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const sanitized = chatService.sanitizeForDialogist(conv);
              const isSelected = conv.id === selectedConvId;
              const rowClass = isSelected
                ? 'border-[#006C9C] bg-[#006C9C]/5'
                : 'border-[#E2E8F0] bg-[#F8FAFC]';

              return (
                <div
                  key={conv.id}
                  className={`rounded-xl border p-3.5 transition-colors space-y-2 ${rowClass}`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedConvId(conv.id)}
                    className="w-full text-left space-y-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#082233]">
                        {copy.seekerLabel}:{' '}
                        {conv.seekerFirstName || sanitized.seekerFirstName} (
                        {copy.firstNameOnly})
                      </span>
                      <Badge
                        variant={conv.isAssigned ? 'approved' : 'warning'}
                        className="text-[11px]"
                      >
                        {conv.isAssigned ? copy.claimedBadge : copy.unansweredBadge}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#5F7383]">
                      <span>
                        {copy.intentLabel}: {conv.intent}
                      </span>
                      <span className="uppercase font-mono">{conv.language}</span>
                    </div>
                  </button>
                  {!conv.isAssigned && !isAuditOnly && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleClaimConversation(conv.id)}
                      className="w-full text-xs font-bold"
                    >
                      {copy.claimBtn}
                    </Button>
                  )}
                  {!conv.isAssigned && isAuditOnly && (
                    <div className="text-center py-1.5 text-[11px] font-mono font-semibold text-[#5F7383] bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
                      {copy.auditReadOnly}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-5 rounded-2xl border border-[#E2E8F0] bg-white space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8C6D32]">
          {copy.draftTitle}
        </h3>
        {/* Form landmark */}
        <form onSubmit={handleCreateTemplateDraft} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Input
              required
              aria-label={copy.shortcutAria}
              value={draftShortcut}
              onChange={(e) => setDraftShortcut(e.target.value)}
              placeholder={copy.shortcutPlaceholder}
              className="text-base sm:text-xs"
            />
            <select
              aria-label={copy.categoryAria}
              value={draftCategory}
              onChange={(e) =>
                setDraftCategory(e.target.value as PredefinedMessageCategory)
              }
              className="min-h-[44px] sm:min-h-0 rounded-xl border border-[#E2E8F0] px-2.5 py-1.5 text-base sm:text-xs bg-white text-[#082233] outline-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
            >
              <option value="GREETING">{copy.catGreeting}</option>
              <option value="THEOLOGY">{copy.catTheology}</option>
              <option value="SHAHADAH">{copy.catShahadah}</option>
              <option value="MISCONCEPTIONS">{copy.catMisconceptions}</option>
            </select>
          </div>
          <Input
            required
            value={draftBodyEn}
            onChange={(e) => setDraftBodyEn(e.target.value)}
            placeholder={copy.bodyEnPlaceholder}
            className="text-base sm:text-xs"
          />
          <Input
            value={draftBodyFr}
            onChange={(e) => setDraftBodyFr(e.target.value)}
            placeholder={copy.bodyFrPlaceholder}
            className="text-base sm:text-xs"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" /> {copy.saveDraftBtn}
          </Button>
        </form>
      </Card>
    </div>
  );
}
