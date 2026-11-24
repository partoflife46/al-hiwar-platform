/**
 * Hero, 3-stage seeker journey, and featured public library sections for HomePage.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/home/home-sections.tsx`.
 *
 * Exported symbols:
 * - `HomeHeroSection` (Function): home hero section definition.
 * - `HomeStagesSection` (Function): home stages section definition.
 * - `HomeFeaturedResources` (Function): home featured resources definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/brand-pattern`
 * - `./home-copy`
 *
 * @module components/home/home-sections
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { IslamicResource, SupportedLanguage } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  LogIn,
  MessageSquare,
  Mic,
  UserPlus,
} from 'lucide-react';
import {
  formatHomeCategory,
  formatHomeResourceType,
  HOME_COPY,
  type RoleActionConfig,
} from './home-copy';

/**
 * Constant definition for highlight icons.
 */
const HIGHLIGHT_ICONS = {
  chat: MessageSquare,
  mic: Mic,
  grad: GraduationCap,
  award: Award,
} as const;

/**
 * Constant definition for stage styles.
 */
const STAGE_STYLES = {
  blue: { icon: Compass, cls: 'bg-[#006C9C]/10 text-[#006C9C]' },
  gold: { icon: Mic, cls: 'bg-[#BC9C5C]/20 text-[#735724]' },
  green: { icon: GraduationCap, cls: 'bg-[#0D7A5F]/15 text-[#0A664F]' },
} as const;

/**
 * Type contract defining home hero section props.
 * Includes fields/members: language, isFr, isAuthenticated, roleAction.
 */
interface HomeHeroSectionProps {
  /** language property. */
  language: SupportedLanguage;
  /** is fr property. */
  isFr: boolean;
  /** is authenticated property. */
  isAuthenticated: boolean;
  /** role action property. */
  roleAction: RoleActionConfig;
}

/** Renders the Al Hiwar institutional hero banner and four platform pillar highlights. */
export function HomeHeroSection({
  language,
  isFr,
  isAuthenticated,
  roleAction,
}: HomeHeroSectionProps) {
  const copy = HOME_COPY[language];
  const primaryLabel = isFr
    ? roleAction.primaryActionLabelFr
    : roleAction.primaryActionLabelEn;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#082233] via-[#005072] to-[#006C9C] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div className="flex items-center gap-4">
          <BrandPatternMark className="h-14 w-14 shrink-0" />
          <div>
            <Badge
              variant="gold-glow"
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              {copy.heroBadge}
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight pt-1">
              {copy.heroHeading}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-xl sm:text-3xl font-bold leading-snug text-white">
            {copy.heroLead}
          </h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {copy.heroSublead}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: 'accent',
                    className: 'gap-2 font-bold px-6 py-3 shadow-lg',
                  })}
                >
                  <UserPlus className="w-4 h-4 text-[#082233]" />
                  {copy.registerCta}
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: 'outline',
                    className:
                      'gap-2 bg-white/10 text-white border-white/30 hover:bg-white/20 px-5 py-3 font-semibold',
                  })}
                >
                  <LogIn className="w-4 h-4 text-[#BC9C5C]" />
                  {copy.signInCta}
                </Link>
              </>
            ) : (
              <Link
                href={roleAction.primaryActionHref}
                className={buttonVariants({
                  variant: 'accent',
                  className: 'gap-2 font-bold px-6 py-3 shadow-lg',
                })}
              >
                <span>{primaryLabel}</span>
                <ArrowRight className="w-4 h-4 text-[#082233]" />
              </Link>
            )}
            <Link
              href="/resources"
              className={buttonVariants({
                variant: 'outline',
                className:
                  'gap-2 bg-white/10 text-white border-white/30 hover:bg-white/20 px-5 py-3',
              })}
            >
              <BookOpen className="w-4 h-4 text-[#BC9C5C]" />
              {copy.browseLibraryCta}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {copy.highlights.map((item) => {
            const Icon = HIGHLIGHT_ICONS[item.icon];
            return (
              <div
                key={item.title}
                className="border-t border-white/20 pt-3.5 space-y-1.5"
              >
                <Icon className="w-5 h-5 text-[#FDF4D4]" aria-hidden="true" />
                <div className="text-sm font-bold">{item.title}</div>
                <p className="text-xs text-slate-50 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Renders the 3-stage progression cards guiding truth seekers to certification. */
export function HomeStagesSection({ language }: { language: SupportedLanguage }) {
  const copy = HOME_COPY[language];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-[#082233]">
          {copy.stagesHeading}
        </h2>
        <p className="text-xs sm:text-sm text-[#5F7383]">
          {copy.stagesSubheading}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {copy.stages.map((stage) => {
          const { icon: Icon, cls } = STAGE_STYLES[stage.tone];
          return (
            <Card
              key={stage.step}
              className="p-6 rounded-3xl border border-[#E2E8F0] bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow] duration-200 ease-out space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cls}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${cls}`}
                  >
                    {stage.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#082233] text-balance">
                  {stage.title}
                </h3>
                <p className="text-xs text-[#5F7383] leading-relaxed">
                  {stage.desc}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={stage.href}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className:
                      'group w-full text-xs font-semibold justify-center gap-1.5',
                  })}
                >
                  <span>{stage.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Renders the featured open-access Islamic resource cards on the home page. */
export function HomeFeaturedResources({
  language,
  isFr,
  resources,
}: {
  language: SupportedLanguage;
  isFr: boolean;
  resources: IslamicResource[];
}) {
  const copy = HOME_COPY[language];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-[#082233]">
            {copy.featuredHeading}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F7383]">
            {copy.featuredSubheading}
          </p>
        </div>
        <Link
          href="/resources"
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: 'gap-1.5 font-semibold',
          })}
        >
          {copy.exploreLibraryBtn} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resources.map((res) => (
          <Card
            key={res.id}
            className="p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#006C9C] transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="primary" className="text-[11px]">
                  {formatHomeCategory(res.category, isFr)}
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {formatHomeResourceType(res.resourceType, isFr)}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-[#082233]">
                {isFr ? res.titleFr : res.titleEn}
              </h3>
              <p className="text-xs text-[#5F7383] line-clamp-3">
                {isFr ? res.descriptionFr : res.descriptionEn}
              </p>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#0D7A5F] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {copy.verifiedResource}
              </span>
              <Link
                href="/resources"
                className="inline-flex items-center min-h-[44px] py-2 font-bold text-[#006C9C] hover:underline"
              >
                {copy.readPlayLink}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
