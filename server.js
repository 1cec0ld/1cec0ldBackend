import { readFileSync } from 'fs';
import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';
import Routes from './config/Routes.js';

const config = {
  name: 'ereq-server',
  port: 3000,
  host: '0.0.0.0',
};
//initialize the API app
const app = express();
//custom method to prefix 'api/v1' to all version 1 routes
app.v1 = (method, route, handler) => {
  if(['get','post','put','delete'].includes(method)) { app[method]('/api/v1'+route,handler) }
  else {
    console.log(`server.js:14, method not supported: ${method}`)
  }
}

//initialize preprocessors (middleware)
app.use(bodyparser.json());
app.use(cors());

//initialize routes
Routes.initialize(app)

//start listening for requests
if(process.env.NODE_ENV == 'development'){
  import('https')
    .then((https) => {
      const certificates = {
        cert:readFileSync(process.env.LOCALHOST_CERT), 
        ca:readFileSync(process.env.LOCALHOST_CERT_AUTHORITY), 
        key:readFileSync(process.env.LOCALHOST_CERT_KEY)
      }
      const httpsServer = https.createServer(certificates, app);
      httpsServer.listen(config.port, config.host, (err)=> {
        if(err) {
          throw new Error('Internal Server Error');
        }
      });
    })
    .catch(err => {
      console.error("HTTPS Module import failure:")
      console.error(err)
    })
} else {
  app.listen(config.port, config.host, (err)=> {
    if(err) {
      throw new Error('Internal Server Error');
    }
  });
}