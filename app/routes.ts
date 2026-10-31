import { type RouteConfig, index, prefix, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),

  // Minecraft DB browser
  route('mcdb', 'routes/mcdb/layout.tsx', [
    index('routes/mcdb/index.tsx'),
    route(':table', 'routes/mcdb/table.tsx'),
  ]),

  // JSON API (resource routes: loaders/actions only, no UI)
  ...prefix('api/v1', [
    route('mc/tables', 'routes/api/mc/tables.ts'),
    route('mc/tables/:table', 'routes/api/mc/table.ts'),
    route('d/headers', 'routes/api/debug/headers.ts'),
    route('d/query', 'routes/api/debug/query.ts'),
    route('d/subparam/:q', 'routes/api/debug/subparam.ts'),
    route('u/login', 'routes/api/user/login.ts'),
  ]),
  route('api/*', 'routes/api/not-found.ts'),

  // Anything unmatched: a quiet 404 page.
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
