// src/services/webhookVerifier.service.js

import crypto from "crypto";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Função que verifica a assinatura do webhook usando HMAC.
 * A assinatura deve ser verificada com a chave secreta do Mercos.
 */
export function verifyWebhookSignature(req) {
  const signature = req.headers["x-mercos-signature"];
  const body = JSON.stringify(req.body); // ou qualquer estrutura do corpo que Mercos usar

  if (!signature) {
    logger?.warn?.("Assinatura do webhook não encontrada.");
    return false;
  }

  const hmac = crypto.createHmac("sha256", env.MERCOS_SECRET_KEY);
  const computedSignature = hmac.update(body).digest("hex");

  if (computedSignature !== signature) {
    logger?.warn?.("Assinatura do webhook inválida.");
    return false;
  }

  logger?.info?.("Assinatura do webhook verificada com sucesso.");
  return true;
}
