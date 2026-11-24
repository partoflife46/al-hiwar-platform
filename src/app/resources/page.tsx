/**
 * Public Islamic Resource Library catalog page with search, category, and format filters.
 */

'use client';

/**
 * Module architecture and API reference for `src/app/resources/page.tsx`.
 *
 * Exported symbols:
 * - `IslamicResourcesPage` (Function): islamic resources page definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `@/components/ui/brand-pattern`
 * - `@/components/resources/resource-viewer-modal`
 * - `@/hooks/use-islamic-resources`
 * - `@/components/resources/resources-page-copy`
 *
 * @module app/resources/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { ResourceType } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  Video,
  Volume2,
} from 'lucide-react';
import { BrandPatternMark } from '@/components/ui/brand-pattern';
import { ResourceViewerModal } from '@/components/resources/resource-viewer-modal';
import { useIslamicResources } from '@/hooks/use-islamic-resources';
import {
  localizeResourceCategory,
  localizeResourceFormat,
  RESOURCE_CATEGORIES,
  RESOURCE_FORMATS,
  RESOURCES_PAGE_COPY,
} from '@/components/resources/resources-page-copy';

/**
 * Constant definition for format icons.
 */
const FORMAT_ICONS: Record<
  ResourceType,
  React.ComponentType<{ className?: string }>
> = {
  PDF: BookOpen,
  AUDIO: Volume2,
  VIDEO: Video,
  TEXT: FileText,
};

/** Renders the open-access Islamic Library page and interactive resource reader modal. */
export default function IslamicResourcesPage() {
  const {
    language,
    setLanguage,
    isFr,
    selectedCategory,
    setSelectedCategory,
    selectedFormat,
    setSelectedFormat,
    searchQuery,
    setSearchQuery,
    resources,
    activeModalResource,
    setActiveModalResource,
    filteredResources,
  } = useIslamicResources();

  const copy = RESOURCES_PAGE_COPY[language];

  return (
    <>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8 space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute -right-6 -bottom-10 opacity-15 pointer-events-none select-none">
            <BrandPatternMark size={220} decorative />
          </div>

          <div className="relative z-10 space-y-2">
            <Badge
              variant="gold-glow"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wide border-[#D8BC7C]/70 bg-[#BC9C5C]/25 text-[#FDF4D4] shadow-sm backdrop-blur-sm"
            >
              <ShieldCheck
                className="w-3.5 h-3.5 text-[#F5E6B3] shrink-0"
                aria-hidden="true"
              />
              <span>{copy.badge}</span>
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {copy.heading}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              {copy.subtitle}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 self-end sm:self-center">
            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 ${
                  language === lang
                    ? 'bg-white text-[#082233] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <Card className="p-5 sm:p-6 rounded-2xl border border-[#CBD5E1] bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F7383]" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="pl-10 text-xs sm:text-sm h-11"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="cat-filter"
                className="text-xs font-bold text-[#082233] shrink-0"
              >
                {copy.categoryLabel}
              </label>
              <select
                id="cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs text-[#082233] focus:border-[#006C9C] focus:outline-none"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {isFr ? c.labelFr : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[#5F7383] mr-1">
                {copy.formatLabel}
              </span>
              {RESOURCE_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedFormat === fmt
                      ? 'bg-[#006C9C] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#5F7383] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {localizeResourceFormat(fmt, isFr)}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-[#5F7383]">
              {copy.showingCount(filteredResources.length, resources.length)}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            const FormatIcon = FORMAT_ICONS[res.resourceType] || FileText;
            const localizedFmt = localizeResourceFormat(res.resourceType, isFr);
            return (
              <Card
                key={res.id}
                className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary" className="text-xs">
                      {localizeResourceCategory(res.category, isFr)}
                    </Badge>
                    <Badge variant="gold" className="text-xs font-mono gap-1">
                      <FormatIcon className="w-3 h-3" />
                      {localizedFmt}
                    </Badge>
                  </div>
                  <h2 className="text-base font-bold text-[#082233] leading-snug">
                    {isFr ? res.titleFr : res.titleEn}
                  </h2>
                  <p className="text-xs text-[#5F7383] leading-relaxed line-clamp-3">
                    {isFr ? res.descriptionFr : res.descriptionEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#0D7A5F] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {copy.verifiedResource}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModalResource(res)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-[#006C9C]/10 hover:bg-[#006C9C]/20 text-xs font-bold text-[#006C9C] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {copy.readViewPrefix} {localizedFmt}
                    </span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 rounded-3xl border border-[#006C9C]/30 bg-gradient-to-r from-[#006C9C]/5 to-[#BC9C5C]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#082233]">
              {copy.questionHeading}
            </h2>
            <p className="text-xs text-[#5F7383]">{copy.questionDesc}</p>
          </div>
          <Link
            href="/dialogue"
            className={buttonVariants({
              variant: 'primary',
              className: 'gap-2 font-bold',
            })}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{copy.startConsultBtn}</span>
          </Link>
        </Card>
      </div>

      <ResourceViewerModal
        isOpen={Boolean(activeModalResource)}
        resource={activeModalResource}
        onClose={() => setActiveModalResource(null)}
        language={language}
      />
    </>
  );
}
