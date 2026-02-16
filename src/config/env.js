import dotenv from "dotenv";

dotenv.config();

export const env = {
  BRAVO_URL: process.env.BRAVO_URL,
  BRAVO_TOKEN: process.env.BRAVO_TOKEN,
  MONGO_URI: process.env.MONGO_URI,
  API_EASY_TOKEN: process.env.API_EASY_TOKEN,
  MERCOS_URL: process.env.MERCOS_URL,
  MERCOS_APP_TOKEN: process.env.MERCOS_APP_TOKEN,
  MERCOS_COMPANY_TOKEN_RHPE: process.env.MERCOS_COMPANY_TOKEN_RHPE,
  MERCOS_COMPANY_TOKEN_ATLANTIS: process.env.MERCOS_COMPANY_TOKEN_ATLANTIS,
};
