import { PrismaClient } from "@prisma/client";

const DB = {
  instance: new PrismaClient()
}
export default DB