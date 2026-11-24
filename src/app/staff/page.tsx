'use client';

/**
 * Module architecture and API reference for `src/app/staff/page.tsx`.
 *
 * Exported symbols:
 * - `UnifiedStaffPortalPage` (Function): unified staff portal page definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/staff/dialogist-tab`
 * - `@/components/staff/instructor-tab`
 * - `@/components/staff/supervisor-tab`
 * - `@/components/staff/admin-tab`
 * - `@/components/staff/staff-confirm-modal`
 *
 * @module app/staff/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/staff`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/staff/page
 * @exports UnifiedStaffPortalPage
 */

import * as React from "react";
import Link from "next/link";
import { useStaffPortal } from "@/hooks/use-staff-portal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, LogIn } from "lucide-react";
import { DialogistTab } from "@/components/staff/dialogist-tab";
import { InstructorTab } from "@/components/staff/instructor-tab";
import { SupervisorTab } from "@/components/staff/supervisor-tab";
import { AdminTab } from "@/components/staff/admin-tab";
import { StaffConfirmModal } from "@/components/staff/staff-confirm-modal";

/**
 * Unified Staff & Governance Console delegating role-isolated views to tab components.
 */
export default function UnifiedStaffPortalPage() {
  const ctx = useStaffPortal();
  const {
    isFr,
    currentUser,
    availableTabs,
    effectiveTab,
    statusBanner,
    setStatusBanner,
    isExternalRole,
  } = ctx;

  if (currentUser && isExternalRole) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <Card className="p-8 rounded-3xl border border-[#E2E8F0] bg-white shadow-lg space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#082233]">
            {isFr ? "Accès Réservé au Personnel" : "Staff Access Required"}
          </h2>
          <p className="text-xs text-[#5F7383]">
            {isFr
              ? "Ce portail est réservé aux dialogistes, enseignants, superviseurs de la Chari’a et administrateurs autorisés."
              : "This portal is restricted to authorized faculty dialogists, academic instructors, supervisors, and platform administrators."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs">
                {isFr ? "Retour à l’accueil" : "Back to Home"}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm" className="text-xs font-bold gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                {isFr ? "Connexion Compte Personnel" : "Sign In with Staff Account"}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="gold-glow" className="text-xs font-bold uppercase tracking-wider">
              {isFr
                ? "Plateforme Al Hiwar • Portail Unifié du Personnel"
                : "Al Hiwar Digital Da’wah & Learning Platform • Unified Staff Portal"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold pt-1">
              {isFr ? "Console Personnel & Gouvernance" : "Staff & Governance Console"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#D8BC7C]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {isFr ? "Connecté en tant que" : "Signed in as"}{" "}
              <strong className="text-white">
                {currentUser?.firstName} {currentUser?.surname}
              </strong>
            </span>
            <Badge
              variant="gold-glow"
              className="text-[11px] font-mono bg-white/15 text-white border-white/25"
            >
              {currentUser?.role || "STAFF"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#BC9C5C] text-[#082233] shadow-md ring-2 ring-white/30"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {statusBanner && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#0D7A5F]/40 bg-[#0D7A5F]/10 p-3.5 text-xs font-bold text-[#0D7A5F] flex items-center justify-between"
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[11px] underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D7A5F]"
          >
            {isFr ? "Fermer" : "Dismiss"}
          </button>
        </div>
      )}

      {effectiveTab === "DIALOGIST" && <DialogistTab ctx={ctx} />}
      {effectiveTab === "INSTRUCTOR" && <InstructorTab ctx={ctx} />}
      {effectiveTab === "SUPERVISOR" && <SupervisorTab ctx={ctx} />}
      {effectiveTab === "ADMINISTRATOR" && <AdminTab ctx={ctx} />}

      <StaffConfirmModal ctx={ctx} />
    </div>
  );
}
