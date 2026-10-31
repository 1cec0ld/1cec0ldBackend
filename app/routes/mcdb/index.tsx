// /mcdb: overview of the visible tables.
import { Link, useRouteLoaderData } from 'react-router';
import type { loader as layoutLoader } from './layout';

export default function McDbIndex() {
  const tables = useRouteLoaderData<typeof layoutLoader>('routes/mcdb/layout')?.tables ?? [];
  return (
    <>
      <h1>Tables</h1>
      <table className="grid index">
        <thead>
          <tr><th>Table</th><th className="num">Rows</th><th>Columns</th></tr>
        </thead>
        <tbody>
          {tables.map(t => (
            <tr key={t.name}>
              <td><Link to={`/mcdb/${t.name}`}>{t.name}</Link></td>
              <td className="num">{t.rows.toLocaleString()}</td>
              <td className="muted">{t.columns.map(c => c.name).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
