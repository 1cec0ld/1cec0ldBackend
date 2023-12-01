import { PrismaClient } from '@prisma/client';

const Prisma = async (req, res) => {
  const db = new PrismaClient();
  const med = await db.analyte.create({
    data: {
      name: 'Methamphetamine'
    }
  })
  .then(response => {
    console.log(response)
    res.status(200).json(response)
  })
  .catch(err => {
    if(err.name === 'PrismaClientKnownRequestError')
    res.status(400).json(err)
  })
}

export default Prisma