'use client';

/**
 * Module architecture and API reference for `src/app/dialogue/page.tsx`.
 *
 * Exported symbols:
 * - `DialoguePage` (Function): dialogue page definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-dialogue-workspace`
 * - `@/components/dialogue/visitor-gate-view`
 * - `@/components/dialogue/seeker-dialogue-view`
 * - `@/components/dialogue/dialogist-dialogue-view`
 * - `@/components/dialogue/supervisor-audit-view`
 * - `@/components/dialogue/new-muslim-dialogue-view`
 *
 * @module app/dialogue/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/dialogue`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/dialogue/page
 * @exports DialoguePage
 */

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useDialogueWorkspace } from "@/hooks/use-dialogue-workspace";
import { VisitorGateView } from "@/components/dialogue/visitor-gate-view";
import { SeekerDialogueView } from "@/components/dialogue/seeker-dialogue-view";
import { DialogistDialogueView } from "@/components/dialogue/dialogist-dialogue-view";
import { SupervisorAuditView } from "@/components/dialogue/supervisor-audit-view";
import { NewMuslimDialogueView } from "@/components/dialogue/new-muslim-dialogue-view";

/**
 * Private Dialogue Center routing each authenticated role to its isolated consultation view.
 */
export default function DialoguePage() {
  const ctx = useDialogueWorkspace();
  const { isLoading, isFr, currentUser } = ctx;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-sm text-[#5F7383]" role="status" aria-live="polite">
          <RefreshCw className="w-4 h-4 animate-spin text-[#006C9C]" aria-hidden="true" />
          <span>
            {isFr
              ? "Connexion au Centre de Dialogue Al Hiwar…"
              : "Connecting to Al Hiwar Dialogue Center…"}
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role === "VISITOR") {
    return <VisitorGateView ctx={ctx} />;
  }
  if (currentUser.role === "NON_MUSLIM") {
    return <SeekerDialogueView ctx={ctx} />;
  }
  if (currentUser.role === "DIALOGIST") {
    return <DialogistDialogueView ctx={ctx} />;
  }
  if (currentUser.role === "SUPERVISOR" || currentUser.role === "ADMINISTRATOR") {
    return <SupervisorAuditView ctx={ctx} />;
  }
  return <NewMuslimDialogueView ctx={ctx} />;
}
