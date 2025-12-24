import dotenv from "dotenv";

dotenv.config();

export const env = {
  BRAVO_URL: process.env.BRAVO_URL,
  BRAVO_TOKEN: process.env.BRAVO_TOKEN,
  MERCOS_SECRET: process.env.MERCOS_SECRET
};
