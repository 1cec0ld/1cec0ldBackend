// /mcdb layout: header with every visible table, then the child page.
import { data, isRouteErrorResponse, Link, NavLink, Outlet } from 'react-router';
import { isUnavailable, tableSummaries, UNAVAILABLE, withDb } from '~/lib/mcdb.server';
import type { Route } from './+types/layout';

export function loader() {
  try {
    return { tables: withDb(tableSummaries) };
  } catch (err) {
    console.error('mcdb error:', (err as Error)?.message ?? err);
    if (isUnavailable(err)) throw data(UNAVAILABLE, { status: 503 });
    throw data({ error: 'Query failed' }, { status: 500 });
  }
}

export function meta() {
  return [{ title: 'Minecraft DB' }];
}

function Header({ tables = [] }: { tables?: { name: string; rows: number }[] }) {
  return (
    <header className="mcdb-header">
      <Link className="home" to="/mcdb">Minecraft DB</Link>
      <nav>
        {tables.map(t => (
          <NavLink key={t.name} to={`/mcdb/${t.name}`}>
            {t.name}<small>{t.rows.toLocaleString()}</small>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default function McDbLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mcdb">
      <Header tables={loaderData.tables} />
      <main><Outlet /></main>
    </div>
  );
}

// Unavailable DB: name the dependency and the setting so it can be fixed.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const body = isRouteErrorResponse(error) ? error.data as Partial<typeof UNAVAILABLE> : null;
  return (
    <div className="mcdb">
      <Header />
      <main className="error">
        {body?.dependency ? (
          <>
            <h1>{body.error}</h1>
            <p>
              Dependency <code>{body.dependency}</code>: no SQLite file at <code>{body.path}</code>.
              Check the <code>{body.setting}</code> setting and the <code>/mcdata</code> mount.
            </p>
          </>
        ) : (
          <h1>Query failed</h1>
        )}
      </main>
    </div>
  );
}
