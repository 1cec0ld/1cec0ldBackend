import JSONPretty from "../util/JSONPretty.js";


const Root = (request, response) => {
  response.set('Content-Type','text/html')
  if(request.headers['user-agent'] == 'ELB-HealthChecker/2.0'){
    console.log('LoadBalancer HealthCheck '+ new Date().toISOString().replace('T',' ') )
    return response.status(200).send('');
  }
  response.status(200).send(JSONPretty(process.env));
}

export default Root