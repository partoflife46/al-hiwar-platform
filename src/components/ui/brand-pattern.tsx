/**
 * UI presentation module for brand pattern within the ui workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/ui/brand-pattern
 * @exports BrandPatternMark
 */

import * as React from 'react';

/**
 * Type contract defining brand pattern mark props.
 * Includes fields/members: className, size, decorative.
 */
interface BrandPatternMarkProps {
  className?: string;
  size?: number | string;
  decorative?: boolean;
}

/**
 * BrandPatternMark renders an authentic 8-fold Islamic geometric rosette
 * utilizing the exact chromatic pattern extracted from the institutional identity:
 * - Madinah Primary Blue: #006C9C
 * - Deep Imperial Navy: #005072
 * - Oasis Accent Gold: #BC9C5C
 * - Sunbeam Radiance Gold: #D8BC7C
 * - Sacred Teal Accent: #1C7890
 * - Midnight Foundation: #082233
 */
export function BrandPatternMark({
  className = 'w-10 h-10',
  size,
  decorative = false,
}: BrandPatternMarkProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      {...(decorative
        ? { 'aria-hidden': true }
        : { 'aria-label': 'Al Hiwar Geometric Brand Pattern', role: 'img' })}
    >
      <defs>
        {/* Subtle radial depth gradient for background disc */}
        <radialGradient id="patternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#082233" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#082233" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Decorative Outer Aura */}
      <circle cx="50" cy="50" r="48" fill="url(#patternGlow)" />
      <circle cx="50" cy="50" r="46" stroke="#BC9C5C" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.6" />

      {/* Outer 8-Point Star Facets (Interlocking Colors: Blues & Golds) */}
      {/* North Point */}
      <polygon points="50,6 61.48,22.28 50,34" fill="#006C9C" />
      <polygon points="50,6 38.52,22.28 50,34" fill="#005072" />

      {/* North-East Point */}
      <polygon points="81.11,18.89 77.72,38.52 61.31,38.69" fill="#BC9C5C" />
      <polygon points="81.11,18.89 61.48,22.28 61.31,38.69" fill="#D8BC7C" />

      {/* East Point */}
      <polygon points="94,50 77.72,61.48 66,50" fill="#006C9C" />
      <polygon points="94,50 77.72,38.52 66,50" fill="#1C7890" />

      {/* South-East Point */}
      <polygon points="81.11,81.11 61.48,77.72 61.31,61.31" fill="#BC9C5C" />
      <polygon points="81.11,81.11 77.72,61.48 61.31,61.31" fill="#D8BC7C" />

      {/* South Point */}
      <polygon points="50,94 38.52,77.72 50,66" fill="#005072" />
      <polygon points="50,94 61.48,77.72 50,66" fill="#006C9C" />

      {/* South-West Point */}
      <polygon points="18.89,81.11 22.28,61.48 38.69,61.31" fill="#BC9C5C" />
      <polygon points="18.89,81.11 38.52,77.72 38.69,61.31" fill="#D8BC7C" />

      {/* West Point */}
      <polygon points="6,50 22.28,38.52 34,50" fill="#006C9C" />
      <polygon points="6,50 22.28,61.48 34,50" fill="#1C7890" />

      {/* North-West Point */}
      <polygon points="18.89,18.89 38.52,22.28 38.69,38.69" fill="#BC9C5C" />
      <polygon points="18.89,18.89 22.28,38.52 38.69,38.69" fill="#D8BC7C" />

      {/* Inner Central Octagon Rosette */}
      <polygon points="50,34 61.31,38.69 66,50 61.31,61.31 50,66 38.69,61.31 34,50 38.69,38.69" fill="#082233" />
      
      {/* Central Radiating Star Facets */}
      <polygon points="50,50 50,34 61.31,38.69" fill="#BC9C5C" />
      <polygon points="50,50 61.31,38.69 66,50" fill="#D8BC7C" />
      <polygon points="50,50 66,50 61.31,61.31" fill="#006C9C" />
      <polygon points="50,50 61.31,61.31 50,66" fill="#005072" />
      <polygon points="50,50 50,66 38.69,61.31" fill="#BC9C5C" />
      <polygon points="50,50 38.69,61.31 34,50" fill="#D8BC7C" />
      <polygon points="50,50 34,50 38.69,38.69" fill="#1C7890" />
      <polygon points="50,50 38.69,38.69 50,34" fill="#006C9C" />

      {/* Central Polished Gold Jewel Core */}
      <circle cx="50" cy="50" r="5" fill="#D8BC7C" stroke="#BC9C5C" strokeWidth="1" />
    </svg>
  );
}
