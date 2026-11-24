/**
 * Persistence layer module defining server fs contracts and storage behavior.
 * Maintains consistent in-memory and JSON-backed platform state across requests.
 * @module lib/db/server-fs
 * @exports ServerFsModules, getServerFs
 */

import fs from 'fs';
import path from 'path';

/**
 * Type contract defining server fs modules.
 * Includes fields/members: fs, path.
 */
export interface ServerFsModules {
  fs: typeof fs;
  path: typeof path;
}

/**
 * Return Node `fs` and `path` modules only on server runtimes outside unit tests.
 * Uses webpack client fallbacks instead of `eval('require')`.
 */
export function getServerFs(): ServerFsModules | null {
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
    return null;
  }
  if (typeof fs?.existsSync !== 'function' || typeof path?.join !== 'function') {
    return null;
  }
  return { fs, path };
}
