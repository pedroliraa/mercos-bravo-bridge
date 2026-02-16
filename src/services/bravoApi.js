import axios from "axios";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/* ======================================================
VALIDAÇÃO DE ENV (FAIL FAST)
====================================================== */
if (!env.BRAVO_URL) {
  logger.error("❌ [BRAVO] BRAVO_URL não definida no ambiente");
  throw new Error("BRAVO_URL não definida");
}

if (!env.BRAVO_TOKEN) {
  logger.error("❌ [BRAVO] BRAVO_TOKEN não definido no ambiente");
  throw new Error("BRAVO_TOKEN não definido");
}

const BRAVO_BASE_URL = env.BRAVO_URL.replace(/\/+$/, "");
logger.info(`🔗 [BRAVO] Base URL configurada: ${BRAVO_BASE_URL}`);

const bravoApi = axios.create({
  baseURL: BRAVO_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.BRAVO_TOKEN}`,
    "Content-Type": "application/json"
  }
});

export async function upsertBravoSeller(payload) {
  logger.info(
    `📤 [BRAVO] Enviando upsert de vendedor | codigo_vendedor=${payload?.codigo_vendedor}`
  );

  try {
    await bravoApi.post("/api/v1/vw_bravo_vendedor", [payload]);

    logger.info(
      `✅ [BRAVO] Upsert de vendedor realizado com sucesso | codigo_vendedor=${payload?.codigo_vendedor}`
    );
  } catch (err) {
    if (err.response) {
      logger.error(
        `🚨 [BRAVO] Erro no upsert | status=${err.response.status} | codigo_vendedor=${payload?.codigo_vendedor}`,
        err.response.data
      );
    } else {
      logger.error(
        `🚨 [BRAVO] Erro ao comunicar com o Bravo | codigo_vendedor=${payload?.codigo_vendedor}`,
        err
      );
    }

    throw err;
  }
}