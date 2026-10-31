import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import serveIndex from 'serve-index';
import Root from '../controllers/Root.js';
import Query from '../controllers/debug/Query.js';
import Headers from '../controllers/debug/Headers.js';
import Subparam from '../controllers/debug/Subparam.js';
import User from '../controllers/user/User.js';
import McDb from '../controllers/mc/McDb.js';

// Repo root, so paths work both in the container (/usr/src/app) and locally.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storage = (dir) => path.join(ROOT, 'storage', dir);

const Routes = {
  initialize: (expressApp) => {
    // Public file listings from the storage directory
    expressApp.use('/downloads', express.static(storage('downloads')), serveIndex(storage('downloads'), { icons: true, view: 'details' }));
    expressApp.use('/dance', express.static(storage('dance')), serveIndex(storage('dance'), { icons: true, view: 'details' }));

    // Minecraft DB browser page
    expressApp.use('/mcdb', express.static(path.join(ROOT, 'public', 'mcdb')));

    ///root [health check]
    expressApp.get('/', Root);
    ///d/ebug routes for reviewing request values
    expressApp.v1('get', '/d/headers', Headers);
    expressApp.v1('get', '/d/query', Query);
    expressApp.v1('get', '/d/subparam/:q', Subparam);
    ///u/ser lookups
    expressApp.v1('get', '/u/login', User.blank);
    expressApp.v1('post', '/u/login', User.login);
    ///mc/ Minecraft PokemonServer DB (read-only, allowlisted tables)
    expressApp.v1('get', '/mc/tables', McDb.tables);
    expressApp.v1('get', '/mc/tables/:table', McDb.rows);
  },
};

export default Routes;
