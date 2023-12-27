import JSONPretty from "../../util/JSONPretty.js";
//import sql_connection from "../../util/MySQL.js"

const Sql = (req, res) => {
  res.set('Content-Type','text/html')
  /*sql_connection.query('SELECT @@version AS version', (err, result) => {
    if (err) {
      res.status(500).send('Error in database operation:',JSONPretty(err));
    } else {
      res.status(200).send(JSONPretty({result: result[0], time: new Date().toISOString()}));
    }
  })*/
}

export default Sql