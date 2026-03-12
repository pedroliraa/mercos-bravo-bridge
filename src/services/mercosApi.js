import axios from "axios";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function createMercosApi(companyToken) {
  const instance = axios.create({
    baseURL: env.MERCOS_URL, // 👈 já é sandbox ou prod automaticamente
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      ApplicationToken: env.MERCOS_APP_TOKEN,
      CompanyToken: companyToken,
    }
  });

  //logger.info(`[MERCOS] ApplicationToken: ${env.MERCOS_APP_TOKEN}`);
  //logger.info(`[MERCOS] CompanyToken: ${companyToken}`);

  instance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      if (error.response?.status === 429) {
        const tempo =
          error.response.data?.tempo_ate_permitir_novamente || 5;

        originalRequest.__retryCount =
          (originalRequest.__retryCount || 0) + 1;

        if (originalRequest.__retryCount > 5) {
          logger.error("[MERCOS] Máximo de tentativas atingido");
          return Promise.reject(error);
        }

        logger.warn(`[MERCOS] 429 | aguardando ${tempo}s`);

        await sleep(tempo);

        return instance(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export default createMercosApi;