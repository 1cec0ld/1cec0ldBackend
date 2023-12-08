import DB from '../../util/DB.js';
import JSONPretty from '../../util/JSONPretty.js';

const Prisma = async (req, res) => {
  let reply = {}
  let status = 400;
  const db = DB.instance;
  await db.testCode.findMany({
    include: {
      childCodes: {
        include: {
          analytes: {
            include: {
              drugClass: true
            }
          }
        }
      },
      analytes: {
        include: {
          drugClass: true
        }
      }
    }
  })
  .then(response => {
    res.set('Content-Type', 'text/html')
    /* Sample response:
    [
      {
        "id": 1,
        "name": "v8.4 OF OTHERS Conf Panel",
        "method": "Confirmation",
        "sampleType": "UT",
        "childCodes": [
          { "id": 2, "name": "v8.4 OF Zolpidem CONF", "method": "Confirmation", "sampleType": "UT" },
          { etc }
        ],
        "analytes": []
      },
      {
        "id": 2,
        "name": "v8.4 OF Zolpidem CONF",
        "method": "Confirmation",
        "sampleType": "UT",
        "analytes": [
          { "id": 1, "name": "Zolpidem", "drugClass": { "id": 1, "name": "Sedative Hypnotics" } }
        ],
        "childCodes": []
      }
    ] A code with Children should have no Analyte(s)
    */
    let codeToClasses = {};
    if(response.length == 0) {
      reply = "No TestCodes found"
      status = 404;
    } else {
      response.forEach(parentCode => {
        if(parentCode.childCodes.length > 0) {
          parentCode.childCodes.forEach(childCode => {
            if(childCode.analytes.length > 0) {
              codeToClasses[parentCode.testCode] = childCode.analytes
            } else {
              reply = "No Analytes found for ChildCode: "+childCode.name
              status = 500;
            }
          })
        } else {
          codeToClasses[parentCode.testCode] = parentCode.analytes
        }
      })
    }
    status = 200;
    res.status(status).send(JSONPretty(codeToClasses))
  })
  .catch(err => {
    console.log(err)
    status = 500;
    res.status(status).send(JSONPretty(err))
  })
}

export default Prisma