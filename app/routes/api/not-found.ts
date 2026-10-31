// Unknown /api paths answer JSON, not the HTML 404 page.
import { json } from '~/lib/api.server';

export const loader = () => json({ error: 'Not found' }, 404);
export const action = loader;
