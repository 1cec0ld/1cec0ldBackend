// GET /api/v1/mc/tables -> allowlisted tables that exist, with columns and row counts
import { json, mcdbFailure } from '~/lib/api.server';
import { tableSummaries, withDb } from '~/lib/mcdb.server';

export function loader() {
  try {
    return json({ tables: withDb(tableSummaries) });
  } catch (err) {
    return mcdbFailure(err);
  }
}
