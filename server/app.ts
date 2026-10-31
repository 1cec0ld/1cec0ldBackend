// The React Router request handler as an Express app. server.js mounts it:
// in production from the built bundle (build/server/index.js), in development
// through Vite's ssrLoadModule so edits hot-reload.
import { RouterContextProvider } from 'react-router';
import { createRequestHandler } from '@react-router/express';
import express from 'express';
import { nonceContext } from '../app/context';

export const app = express();
// server.js disables this on the outer app; this inner app would add it back.
app.disable('x-powered-by');

app.use(
  createRequestHandler({
    build: () => import('virtual:react-router/server-build'),
    getLoadContext(_req, res) {
      const context = new RouterContextProvider();
      // Set per request by server.js, which also puts it in the CSP header.
      context.set(nonceContext, String(res.locals.nonce ?? ''));
      return context;
    },
  }),
);
