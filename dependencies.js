// Boot gate: every dependency the server declares must be satisfied at start.
// A missing one stops the process before it listens, naming every problem at
// once. Under Dokku that's a failed deploy, in front of whoever is deploying,
// instead of an endpoint quietly returning errors later.
//
// A deployment that genuinely runs without one declares it:
//   DEPENDENCIES_ABSENT=mcdb
// The waiver is printed on every boot. Waiving an unknown name also fails the boot
// (a typo would otherwise look like a successful waiver).

import fs from 'node:fs';
import { DB_PATH as MC_DB_PATH } from './util/McDb.js';

const isDev = () => process.env.NODE_ENV === 'development';

// check() returns a list of problems (empty = satisfied). Never include secret values.
export const DEPENDENCIES = [
  {
    name: 'mcdb',
    purpose: 'Minecraft PokemonServer SQLite DB, browsed at /mcdb and /api/v1/mc',
    check: () => fs.existsSync(MC_DB_PATH)
      ? []
      : [`file not found at ${MC_DB_PATH} (set MC_DB_PATH, or mount the plugin dir at /mcdata; see README)`],
  },
  {
    name: 'dev-https',
    purpose: 'local HTTPS certificates (development only)',
    check: () => !isDev() ? [] :
      ['LOCALHOST_CERT', 'LOCALHOST_CERT_AUTHORITY', 'LOCALHOST_CERT_KEY'].flatMap(v =>
        !process.env[v]?.trim() ? [`${v} is not set`]
        : !fs.existsSync(process.env[v]) ? [`${v} points to a missing file`]
        : []),
  },
];

export function assertDependenciesSatisfied() {
  const known = DEPENDENCIES.map(d => d.name);
  const absent = (process.env.DEPENDENCIES_ABSENT || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const faults = absent
    .filter(name => !known.includes(name))
    .map(name => `DEPENDENCIES_ABSENT names unknown dependency "${name}" (known: ${known.join(', ')})`);

  for (const dep of DEPENDENCIES) {
    if (absent.includes(dep.name)) {
      console.warn(`[boot] dependency "${dep.name}" WAIVED by DEPENDENCIES_ABSENT: ${dep.purpose} will not work`);
      continue;
    }
    for (const problem of dep.check()) faults.push(`${dep.name} (${dep.purpose}): ${problem}`);
  }

  if (faults.length) {
    console.error('[boot] refusing to start, unsatisfied dependencies:\n  - ' + faults.join('\n  - '));
    process.exit(1);
  }
}
