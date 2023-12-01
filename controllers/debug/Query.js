import JSONPretty from "../../util/JSONPretty.js"

const Query = (req, res) => {
  res.set('Content-Type','text/html')
  res.status(200).send(JSONPretty(req.query))
}

export default Query