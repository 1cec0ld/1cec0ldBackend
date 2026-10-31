// Helpers for JSON resource routes under /api.
import { isUnavailable, UNAVAILABLE } from './mcdb.server';

export const json = (body: unknown, status = 200) => Response.json(body, { status });

// Turn a Minecraft DB failure into a JSON error. Unavailable names the dependency and setting.
export const mcdbFailure = (err: unknown) => {
  console.error('mcdb error:', (err as Error)?.message ?? err);
  return isUnavailable(err) ? json(UNAVAILABLE, 503) : json({ error: 'Query failed' }, 500);
};
