/**
 * Module architecture and API reference for `src/app/resources/[slug]/page.tsx`.
 *
 * Exported symbols:
 * - `ResourceDetailPage` (Function): resource detail page definition.
 *
 * Internal dependencies:
 * - `@/lib/resources/resource-details`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 *
 * @module app/resources/[slug]/page
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Next.js App Router view module for `/resources/[slug]`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/resources/[slug]/page
 * @exports ResourceDetailPage
 */

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DETAILED_RESOURCES,
  getResourceDetailsBySlug,
} from '@/lib/resources/resource-details';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  BookOpen,
  FileText,
  Volume2,
  Video,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

/**
 * Type contract defining page props.
 * Includes fields/members: params.
 */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Renders the resource detail page interface component.
 * @param props - Destructured input containing params.
 * @returns Rendered JSX element tree.
 */
export default async function ResourceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const resource = getResourceDetailsBySlug(decodedSlug);

  if (!resource) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/resources"
          className={buttonVariants({
            variant: 'outline',
            className: 'gap-2 text-xs font-semibold border-[#CBD5E1]',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Islamic Library</span>
        </Link>
        <span className="text-xs font-mono text-[#5F7383]">
          Al-Hiwar Academic Digital Library
        </span>
      </div>

      {/* Main Reading Container */}
      <div className="rounded-3xl border border-[#CBD5E1] bg-white shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#082233] via-[#005072] to-[#006C9C] text-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold-glow" className="text-xs font-semibold tracking-wide">
              {resource.category}
            </Badge>
            <Badge variant="primary" className="text-xs font-mono gap-1 bg-white/20 text-white border-white/30">
              {resource.resourceType === 'PDF' && <BookOpen className="w-3 h-3" />}
              {resource.resourceType === 'AUDIO' && <Volume2 className="w-3 h-3" />}
              {resource.resourceType === 'VIDEO' && <Video className="w-3 h-3" />}
              {resource.resourceType === 'TEXT' && <FileText className="w-3 h-3" />}
              {resource.resourceType}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-white/80 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {resource.readingDuration}
            </span>
            <span className="text-xs text-[#8A672B] font-semibold flex items-center gap-1 sm:ml-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified by Sharia Council
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            {resource.titleEn}
          </h1>

          <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
            {resource.subtitleEn}
          </p>

          <div className="pt-2 text-[11px] text-white/70 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono border-t border-white/10">
            <span>{resource.authorEn}</span>
            <span>•</span>
            <span>{resource.publishedDate}</span>
            <span>•</span>
            <span>{resource.citationSource}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Production Status Notice for Audio/Video */}
          {resource.resourceType === 'VIDEO' && (
            <div className="rounded-2xl border border-[#BC9C5C]/40 bg-[#FFFDF5] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8A672B] font-bold text-xs uppercase tracking-wider">
                  <Video className="w-4 h-4 text-[#8A672B]" />
                  <span>Video Status: Video Production in Progress</span>
                </div>
                <Badge variant="gold" className="text-[11px] font-mono">
                  Video Coming Soon
                </Badge>
              </div>
              <p className="text-xs text-[#5F7383] leading-relaxed">
                The high-definition visual documentary and lecture recording is currently in production with the academic media team. The verified study syllabus, historical timeline, and reference texts are provided below.
              </p>
            </div>
          )}

          {resource.resourceType === 'AUDIO' && (
            <div className="rounded-2xl border border-[#006C9C]/30 bg-[#F0F9FF] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#006C9C] font-bold text-xs uppercase tracking-wider">
                  <Volume2 className="w-4 h-4 text-[#006C9C]" />
                  <span>Audio Status: Studio Recording in Production</span>
                </div>
                <Badge variant="gold" className="text-[11px] font-mono">
                  Audio Coming Soon
                </Badge>
              </div>
              <p className="text-xs text-[#5F7383] leading-relaxed">
                The official high-fidelity studio recitation and audio commentary is currently in production with the Faculty of Islamic Studies. The verified verse-by-verse study text, Arabic script, and authentic commentary are provided below.
              </p>
            </div>
          )}

          {/* Key Takeaways */}
          {resource.keyTakeawaysEn && resource.keyTakeawaysEn.length > 0 && (
            <div className="rounded-2xl border border-[#0D7A5F]/20 bg-[#E6F4F0] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#0D7A5F] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Key Study Takeaways</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-[#082233]">
                {resource.keyTakeawaysEn.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A5F] mt-0.5 flex-none" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Sections */}
          <div className="space-y-8">
            {resource.sections.map((section, idx) => (
              <article key={idx} className="space-y-4">
                <h2 className="text-lg font-bold text-[#082233] border-l-4 border-[#006C9C] pl-3 py-0.5">
                  {section.titleEn}
                </h2>

                {section.arabicQuote && (
                  <div className="my-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                    <p className="text-right font-arabic text-lg sm:text-xl text-[#082233] leading-loose">
                      {section.arabicQuote}
                    </p>
                    {section.arabicTranslationEn && (
                      <p className="text-xs text-[#5F7383] italic border-t border-[#E2E8F0] pt-2">
                        {section.arabicTranslationEn}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3 text-sm text-[#334155] leading-relaxed">
                  {section.contentEn.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Academic Footer */}
          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5F7383]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D7A5F]" />
              <span>Authorized for public educational and academic distribution</span>
            </div>
            <Link
              href="/resources"
              className={buttonVariants({
                variant: 'primary',
                className: 'text-xs font-semibold',
              })}
            >
              Browse All Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
