// /api/v1/u/login: placeholder until real auth exists. Accepts anyone.
import { json } from '~/lib/api.server';

export function loader() {
  return json({ user: null, error: 'Post Only' });
}

export function action() {
  return json({ token: 'fragglerock', user: { name: 'User.Name', permission: 'admin' } });
}
