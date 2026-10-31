// GET /api/v1/d/headers -> the request headers (minus cookies)
import { json } from '~/lib/api.server';
import type { Route } from './+types/headers';

export function loader({ request }: Route.LoaderArgs) {
  const headers = Object.fromEntries(request.headers);
  delete headers.cookie;
  return json(headers);
}
