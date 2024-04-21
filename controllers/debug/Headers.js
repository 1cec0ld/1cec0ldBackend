import JSONPretty from "../../util/JSONPretty.js"

const Headers = (req, res)=> {
  res.set('Content-Type','text/html')
  let copied = JSON.parse(JSON.stringify(req.headers))
  delete copied['cookie']
  res.status(200).send(JSONPretty(copied))
}


export default Headers 