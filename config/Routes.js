import Root from "../controllers/Root.js"
import Query from "../controllers/debug/Query.js"
import Headers from "../controllers/debug/Headers.js"
import Sql from "../controllers/debug/Sql.js"
import Subparam from "../controllers/debug/Subparam.js"
import User from "../controllers/user/User.js"
import McDb from "../controllers/mc/McDb.js"
import serveIndex from 'serve-index';
import express from 'express';

const Routes = {
  initialize: (expressApp) => {
    // Serve downloads from the storage directory
    expressApp.use('/downloads', express.static('/usr/src/app/storage/downloads'), serveIndex('/usr/src/app/storage/downloads', { icons: true, view: 'details' }));
    // Serve downloads from the storage directory
    expressApp.use('/dance', express.static('/usr/src/app/storage/dance'), serveIndex('/usr/src/app/storage/dance', { icons: true, view: 'details' }));
    


    // Minecraft DB browser page
    expressApp.use('/mcdb', express.static('/usr/src/app/public/mcdb'));

    //define routes
    ///root [mostly for AWS Health checks]
    expressApp.get('/', Root);
    ///d/ebug routes for reviewing variable values
    expressApp.v1('get', '/d/headers', Headers)
    expressApp.v1('get', '/d/query', Query)
    expressApp.v1('get', '/d/sql', Sql)
    expressApp.v1('get', '/d/subparam/:q', Subparam)
    ///u/ser lookups
    expressApp.v1('get',  '/u/login', User.blank)
    expressApp.v1('post', '/u/login', User.login)
    ///mc/ Minecraft PokemonServer DB (read-only, allowlisted tables)
    expressApp.v1('get', '/mc/tables', McDb.tables)
    expressApp.v1('get', '/mc/tables/:table', McDb.rows)
    ///p/ublic downloads
    //expressApp.v1('get',  '/p/downloads', Downloads.all)
  }
}

export default Routes