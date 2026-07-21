import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
//import { PrismaClient } from "../../generated/prisma/client"; 
import { PrismaClient } from "../../node_modules/.prisma/client.js"; 

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const adapter = new PrismaMariaDb({
  host: getEnv("DATABASE_HOST"),
  user: getEnv("DATABASE_USER"),
  password: getEnv("DATABASE_PASSWORD"),
  database: getEnv("DATABASE_NAME"),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };