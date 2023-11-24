const fs = require ('fs');
const express = require('express');
const https = require('https');
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
  res.status(200).send('hello world');
  console.log("get: ",200);
  console.log(process.env)
});

if(process.env.NODE_ENV=='development'){
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