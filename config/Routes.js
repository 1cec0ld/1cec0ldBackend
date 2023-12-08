import Root from "../controllers/Root.js"
import Email from "../controllers/debug/Email.js"
import Query from "../controllers/debug/Query.js"
import Headers from "../controllers/debug/Headers.js"
import Sql from "../controllers/debug/Sql.js"
import Subparam from "../controllers/debug/Subparam.js"
import Prisma from "../controllers/debug/Prisma.js"
import Populate from "../controllers/debug/Populate.js"
import Insurances from "../controllers/master/Insurances.js"
import Tests from "../controllers/master/Tests.js"

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
    expressApp.v1('get', '/m/zipcode/:val',()=>{})
    expressApp.v1('get', '/m/insurances', Insurances.index)
    expressApp.v1('get', '/m/tests', Tests.getAll)
    ///a/ccount lookups
    
  }
}

export default Routes