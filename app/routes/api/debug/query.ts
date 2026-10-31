// GET /api/v1/d/query -> the query string as an object
import { json } from '~/lib/api.server';
import type { Route } from './+types/query';

export function loader({ request }: Route.LoaderArgs) {
  return json(Object.fromEntries(new URL(request.url).searchParams));
}
