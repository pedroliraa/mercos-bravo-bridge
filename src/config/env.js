import dotenv from "dotenv";

dotenv.config();

if (!process.env.APP_ENV) {
  throw new Error("APP_ENV não definido no .env");
}

const isSandbox = process.env.APP_ENV === "sandbox";

export const env = {
  APP_ENV: process.env.APP_ENV,

  BRAVO_URL: process.env.BRAVO_URL,
  BRAVO_TOKEN: process.env.BRAVO_TOKEN,

  MONGO_URI: process.env.MONGO_URI,
  API_EASY_TOKEN: process.env.API_EASY_TOKEN,

  // 🔥 MERCOS DINÂMICO
  MERCOS_URL: isSandbox
    ? process.env.MERCOS_URL_SANDBOX
    : process.env.MERCOS_URL,

  MERCOS_APP_TOKEN: isSandbox
    ? process.env.MERCOS_APP_TOKEN_SANDBOX
    : process.env.MERCOS_APP_TOKEN,

  MERCOS_COMPANY_TOKEN_ATLANTIS: isSandbox
    ? process.env.MERCOS_COMPANY_TOKEN_ATLANTIS_SANDBOX
    : process.env.MERCOS_COMPANY_TOKEN_ATLANTIS,

  MERCOS_COMPANY_TOKEN_RHPE: isSandbox
    ? process.env.MERCOS_COMPANY_TOKEN_RHPE_SANDBOX
    : process.env.MERCOS_COMPANY_TOKEN_RHPE,
};