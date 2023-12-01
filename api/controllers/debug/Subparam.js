import JSONPretty from "../../../util/JSONPretty.js"

const Subparam = (req, res)=> {
  res.set('Content-Type','text/html')
  let copied = JSON.parse(JSON.stringify(req.params))
  res.status(200).send(JSONPretty(copied))
}

export default Subparam