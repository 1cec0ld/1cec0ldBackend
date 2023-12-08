import DB from "../../util/DB.js";

const prisma = DB.instance;

const getAll = async () => {
  const all = await prisma.insuranceCompany.findMany({
    include: {
      rules: true
    }
  })
  // return the ones with Top in the lisNote, sorted by how many rules they have
  return all
    .filter(each => each.lisNote.includes('Top'))
    .sort((a,b) => b.rules.length - a.rules.length)
}

const Insurances = {
  index: (req, res) => {
    console.log('Insurances index');
    // response content type is json
    res.set('Content-Type','application/json')
    // return json of all Insurances
    getAll()
      .then(response => {
        res.status(200).json(response)
      })
  }
}

export default Insurances