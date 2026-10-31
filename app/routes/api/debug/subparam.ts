// GET /api/v1/d/subparam/:q -> the route params
import { json } from '~/lib/api.server';
import type { Route } from './+types/subparam';

export function loader({ params }: Route.LoaderArgs) {
  return json(params);
}
