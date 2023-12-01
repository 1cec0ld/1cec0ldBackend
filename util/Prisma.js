import { PrismaClient } from '@prisma/client';

class DB {
  static db = new PrismaClient();

  select = (sqlIn) => {

  }

}


export default DB