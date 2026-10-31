import { data } from 'react-router';

export function loader() {
  throw data('The requested page could not be found.', { status: 404 });
}

export default function NotFound() {
  return null;
}
