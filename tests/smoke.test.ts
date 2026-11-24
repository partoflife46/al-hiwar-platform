import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { cn } from '@/lib/utils';

describe('Platform Smoke Test (Task 1.1)', () => {
  it('resolves @/* path aliases and merges Tailwind classes cleanly', () => {
    const merged = cn('px-4 py-2 bg-[#006C9C]', 'px-6 text-white');
    expect(merged).toBe('py-2 bg-[#006C9C] px-6 text-white');
  });

  it('verifies public directory and assets structure readiness', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    expect(fs.existsSync(publicDir)).toBe(true);
  });
});
