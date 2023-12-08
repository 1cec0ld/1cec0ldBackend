import DB from '../../util/DB.js';
import JSONPretty from '../../util/JSONPretty.js';

const Populate = async (req, res) => {
  let reply = []
  const db = DB.instance;
  await db.analyte.update({
    where: {
      id: 22
    },
    data: {
      testCodes: {
        connect: [
          { id: 24 },
          { id: 65 },
          /*{ id: 1678 }/**/
        ]
      }
    }
  })
  .then(response => {
    console.log("Analyte Update")
    console.log(response)
    reply.push(response)
    //res.status(200).json(response)
  })
  .catch(err => {
    console.log(err)
    reply.push(err)
    //res.status(400).json(err)
  })
  // Create a TestCode Anticonvulsants, assign its childCodes as a list of newly created Testcodes, Carbamazepine, Gabapentin, and Pregabalin
  /*await db.testCode.create({
    data: {
      testCode: 'v8.4 OF OTHERS Conf Panel',
      method: "Confirmation",
      sampleType: "UT",
      childCodes: {
        create: [
          { testCode: 'v8.4 OF Zolpidem CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
          { testCode: 'v8.4 OF Methamphetamine CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
          { testCode: 'v8.4 OF Methadone CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
          { testCode: 'v8.4 OF Tramadol CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
          { testCode: 'v8.4 OF Oxycodone CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
          { testCode: 'v8.4 OF Oxymorphone CONF',
            method: "Confirmation",
            sampleType: "UT"
          },
        ]
      }
    }
  })
  .then(response => {
    console.log("TestCode Create")
    console.log(response)
    reply.push(response)
    //res.status(200).json(response)
  })
  .catch(err => {
    console.log(err)
    reply.push(err)
    //res.status(400).json(err)
  })*/
  res.set('Content-Type','text/html')
  res.status(200).send(JSONPretty(reply))
}

export default Populate