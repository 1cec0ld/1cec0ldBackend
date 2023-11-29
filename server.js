const fs = require ('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const config = {
  name: 'ereq-server',
  port: 3000,
  host: '0.0.0.0',
};

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('hello '+process.env.NODE_ENV);
  console.log("get: ",200);
  console.log(process.env)
  console.log(req.headers)
});

if(process.env.NODE_ENV=='development'){
  const https = require('https');
  const certificates = {
    cert:fs.readFileSync('./dev_rxight_web_certs/localhost.cer'), 
    ca:fs.readFileSync('./dev_rxight_web_certs/ca.crt'), 
    key:fs.readFileSync('./dev_rxight_web_certs/localhost.key')
  }
  const httpsServer = https.createServer(certificates, app);
  httpsServer.listen(config.port, config.host, (err)=> {
    if(err) {
      throw new Error('Internal Server Error');
    }
  });
} else {
  app.listen(config.port, config.host, (err)=> {
    if(err) {
      throw new Error('Internal Server Error');
    }
  });
}