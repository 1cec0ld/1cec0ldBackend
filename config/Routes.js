import Root from "../controllers/Root.js"
import Email from "../controllers/debug/Email.js"
import Query from "../controllers/debug/Query.js"
import Headers from "../controllers/debug/Headers.js"
import Sql from "../controllers/debug/Sql.js"
import Subparam from "../controllers/debug/Subparam.js"
import Prisma from "../controllers/debug/Prisma.js"
import Populate from "../controllers/debug/Populate.js"
import User from "../controllers/user/User.js"

const Routes = {
  initialize: (expressApp) => {
    //define routes
    ///root [mostly for AWS Health checks]
    expressApp.get('/', Root);
    ///d/ebug routes for reviewing variable values
    expressApp.v1('get', '/d/email', Email)
    expressApp.v1('get', '/d/headers', Headers)
    expressApp.v1('get', '/d/populate', Populate),
    expressApp.v1('get', '/d/prisma', Prisma)
    expressApp.v1('get', '/d/query', Query)
    expressApp.v1('get', '/d/sql', Sql)
    expressApp.v1('get', '/d/subparam/:q', Subparam)
    ///m/aster lookups
    expressApp.v1('get',  '/u/login', User.blank)
    expressApp.v1('post', '/u/login', User.login)
    ///a/ccount lookups
    
  }
}

export default Routes