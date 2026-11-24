/**
 * Structured monograph and section contracts for public Islamic Library resources.
 */

import type { ResourceCategory, ResourceType } from "@/lib/db/types";

/** Individual study section with optional Arabic quotation and translation. */
export interface ResourceSection {
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** content en property. */
  contentEn: string[];
  /** content fr property. */
  contentFr: string[];
  /** Optional arabic quote property. */
  arabicQuote?: string;
  /** Optional arabic transliteration property. */
  arabicTransliteration?: string;
  /** Optional arabic translation en property. */
  arabicTranslationEn?: string;
  /** Optional arabic translation fr property. */
  arabicTranslationFr?: string;
}

/** Complete bilingual monograph metadata and content for a library entry. */
export interface DetailedResourceContent {
  /** id property. */
  id: string;
  /** slug property. */
  slug: string;
  /** category property. */
  category: ResourceCategory;
  /** resource type property. */
  resourceType: ResourceType;
  /** title en property. */
  titleEn: string;
  /** title fr property. */
  titleFr: string;
  /** subtitle en property. */
  subtitleEn: string;
  /** subtitle fr property. */
  subtitleFr: string;
  /** author en property. */
  authorEn: string;
  /** author fr property. */
  authorFr: string;
  /** published date property. */
  publishedDate: string;
  /** reading duration property. */
  readingDuration: string;
  /** citation source property. */
  citationSource: string;
  /** Optional audio sample url property. */
  audioSampleUrl?: string;
  /** key takeaways en property. */
  keyTakeawaysEn: string[];
  /** key takeaways fr property. */
  keyTakeawaysFr: string[];
  /** sections property. */
  sections: ResourceSection[];
}
