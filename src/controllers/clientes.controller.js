import logger from "../utils/logger.js";

export async function handleClienteWebhook(req, res) {
  logger.info("Webhook cliente recebido");
  
  // Ainda não implementamos normalização → deixaremos vazio
  return res.status(200).json({ ok: true });
}

export async function handleClienteDelete(req, res) {
  logger.info("Webhook cliente delete recebido");
  return res.status(200).json({ ok: true });
}
