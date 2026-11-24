/**
 * Client state and side-effect hook module for use islamic resources.
 * Coordinates API requests, live state synchronization, and UI callback handlers.
 * @module hooks/use-islamic-resources
 * @exports RESOURCE_CATEGORIES, RESOURCE_FORMATS, useIslamicResources
 */

import * as React from "react";
import { db } from "@/lib/db/in-memory-adapter";
import type { IslamicResource, ResourceCategory, ResourceType } from "@/lib/db/types";
import { useLanguage } from "@/lib/context/language-context";

/**
 * Constant definition for resource categories.
 */
export const RESOURCE_CATEGORIES: { value: "ALL" | ResourceCategory; labelEn: string; labelFr: string }[] = [
  { value: "ALL", labelEn: "All Topics", labelFr: "Tous les Thèmes" },
  { value: "QURAN", labelEn: "The Noble Qur’an", labelFr: "Le Noble Coran" },
  { value: "PROPHET", labelEn: "Prophet Muhammad ﷺ", labelFr: "Prophète Muhammad ﷺ" },
  { value: "PILLARS", labelEn: "Pillars of Islam & Faith", labelFr: "Piliers de l’Islam & Foi" },
  { value: "ETHICS", labelEn: "Values & Ethics", labelFr: "Valeurs & Éthique" },
  { value: "MISCONCEPTIONS", labelEn: "Common Questions", labelFr: "Questions Fréquentes" },
];

/**
 * Constant definition for resource formats.
 */
export const RESOURCE_FORMATS: ("ALL" | ResourceType)[] = ["ALL", "TEXT", "PDF", "AUDIO", "VIDEO"];

/**
 * Manages public Islamic resource loading, URL query sync, filtering, and modal selection.
 */
export function useIslamicResources() {
  const CATEGORIES = RESOURCE_CATEGORIES;
  const FORMATS = RESOURCE_FORMATS;
  const { language, setLanguage, isFr } = useLanguage();
  const [selectedCategory, setSelectedCategory] = React.useState<'ALL' | ResourceCategory>('ALL');
  const [selectedFormat, setSelectedFormat] = React.useState<'ALL' | ResourceType>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [resources, setResources] = React.useState<IslamicResource[]>([]);
  const [urlSynced, setUrlSynced] = React.useState(false);
  const [activeModalResource, setActiveModalResource] = React.useState<IslamicResource | null>(null);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const fmt = params.get('format');
    const q = params.get('q');
    if (cat && CATEGORIES.some((c) => c.value === cat)) {
      setSelectedCategory(cat as 'ALL' | ResourceCategory);
    }
    if (fmt && FORMATS.includes(fmt as 'ALL' | ResourceType)) {
      setSelectedFormat(fmt as 'ALL' | ResourceType);
    }
    if (q) {
      setSearchQuery(q);
    }
    setUrlSynced(true);
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (!urlSynced || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    else params.delete('category');
    if (selectedFormat !== 'ALL') params.set('format', selectedFormat);
    else params.delete('format');
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    else params.delete('q');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [selectedCategory, selectedFormat, searchQuery, urlSynced]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    /**
     * Asynchronously executes load resources logic.
     * @returns Promise resolving once the operation completes.
     */
    async function loadResources() {
      try {
        const res = await fetch('/api/resources', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.data)) {
            setResources(json.data);
            checkAutoOpen(json.data);
            return;
          }
        }
      } catch {
        // fallback below
      }
      const initial = db.getPublicIslamicResources();
      setResources(initial);
      checkAutoOpen(initial);
    }

    /**
     * Executes check auto open logic.
     * @param items - Items value (`IslamicResource[]`).
     */
    function checkAutoOpen(items: IslamicResource[]) {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const openId = params.get('open') || params.get('id');
      if (openId) {
        const matched = items.find((r) => r.id === openId || r.mediaUrl.includes(openId));
        if (matched) {
          setActiveModalResource(matched);
        }
      }
    }

    loadResources();
  }, []);

  /**
   * Memoized handler/selector for filtered resources.
   */
  const filteredResources = React.useMemo(() => {
    return resources.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedFormat !== 'ALL' && r.resourceType !== selectedFormat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.titleEn.toLowerCase().includes(q) ||
          r.titleFr.toLowerCase().includes(q) ||
          r.descriptionEn.toLowerCase().includes(q) ||
          r.descriptionFr.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [resources, selectedCategory, selectedFormat, searchQuery]);


  return {
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
  };
}
