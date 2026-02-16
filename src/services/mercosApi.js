import axios from "axios";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function createMercosApi(companyToken) {
  const instance = axios.create({
    baseURL: env.MERCOS_URL,
    headers: {
      "Content-Type": "application/json",
      ApplicationToken: env.MERCOS_APP_TOKEN,
      CompanyToken: companyToken,
    }
  });

  // 🔥 INTERCEPTOR GLOBAL DE THROTTLING (INALTERADO)
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
          logger.error(
            `[THROTTLING] Limite máximo de tentativas atingido`
          );
          return Promise.reject(error);
        }

        logger.warn(
          `[THROTTLING] 429 recebido | aguardando ${tempo}s | tentativa=${originalRequest.__retryCount}`
        );

        await sleep(tempo);

        return instance(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export async function getMercosSellerById(id) {
  logger.info(`[MERCOS] Buscando vendedor no Mercos | id=${id}`);

  const tokens = [
    env.MERCOS_COMPANY_TOKEN_RHPE,
    env.MERCOS_COMPANY_TOKEN_ATLANTIS
  ];

  for (let i = 0; i < tokens.length; i++) {
    const mercosApi = createMercosApi(tokens[i]);

    try {
      const { data } = await mercosApi.get(`/usuarios/${id}`);

      logger.info(
        `[MERCOS] Vendedor encontrado na empresa ${i === 0 ? "RHPE" : "ATLANTIS"} | id=${data?.id} | nome=${data?.nome}`
      );

      return {
        empresa: i === 0 ? "filial" : "matriz", // 🔥 CORRIGIDO AQUI
        vendedor: data
      };
    } catch (err) {
      if (err.response?.status === 404) {
        logger.warn(
          `[MERCOS] Vendedor não encontrado na empresa ${i === 0 ? "RHPE" : "ATLANTIS"} | tentando próxima`
        );
        continue; // tenta próxima empresa
      }

      if (err.response) {
        logger.error(
          `[MERCOS] Erro na API Mercos | status=${err.response.status} | id=${id}`,
          err.response.data
        );
      } else {
        logger.error(
          `[MERCOS] Erro ao chamar API Mercos | id=${id}`,
          err
        );
      }

      throw err;
    }
  }

  logger.error(
    `[MERCOS] Vendedor não encontrado em nenhuma empresa | id=${id}`
  );

  throw new Error("Vendedor não encontrado em nenhuma empresa");
}