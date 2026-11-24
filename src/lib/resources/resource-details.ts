/**
 * Public Islamic Library monograph registry and lookup helpers.
 */

export type {
  DetailedResourceContent,
  ResourceSection,
} from "./details/types";

import type { DetailedResourceContent } from "./details/types";
import { RES_1 } from "./details/res-1";
import { RES_2 } from "./details/res-2";
import { RES_3 } from "./details/res-3";
import { RES_4 } from "./details/res-4";
import { RES_5 } from "./details/res-5";
import { RES_6 } from "./details/res-6";
import { RES_7 } from "./details/res-7";
import { RES_8 } from "./details/res-8";

/** Indexed catalog of full-text verified Islamic Library monographs. */
export const DETAILED_RESOURCES: Record<string, DetailedResourceContent> = {
  'res-1': RES_1,
  'res-2': RES_2,
  'res-3': RES_3,
  'res-4': RES_4,
  'res-5': RES_5,
  'res-6': RES_6,
  'res-7': RES_7,
  'res-8': RES_8,
};

/** Retrieves full monograph details by resource ID. */
export function getResourceDetailsById(id: string): DetailedResourceContent | undefined {
  return DETAILED_RESOURCES[id];
}

/**
 * Executes get resource details by slug logic.
 * @param slug - Slug value (`string`).
 * @returns Value of type `DetailedResourceContent | undefined`.
 */
export function getResourceDetailsBySlug(slug: string): DetailedResourceContent | undefined {
  const cleanSlug = slug.replace(/^\/resources\//, '').replace(/^\//, '');
  return Object.values(DETAILED_RESOURCES).find(
    (r) => r.slug === cleanSlug || r.id === cleanSlug || r.slug === `${cleanSlug}.pdf`
  );
}

