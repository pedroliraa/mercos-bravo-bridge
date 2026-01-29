// api/retry.js - Vercel serverless function (GET /api/retry)
import { processIntegrationEvent } from "../src/processors/integration.processor.js";
import IntegrationEvent from "../src/models/integrationEvent.model.js";
import { handleNotaFromPedido } from "../src/controllers/notas.controller.js";
import { handleClienteWebhook } from "../src/controllers/clientes.controller.js";
import { handlePedidoWebhook } from "../src/controllers/pedidos.controller.js";
import logger from "../src/utils/logger.js";
import { connectMongo } from "../src/database/mongo.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectMongo();
    logger.info("[RETRY] Iniciando processamento de retry na Vercel");

    const COOLDOWN_MINUTES = 5;
    const MAX_RETRIES = 3;

    const failedEvents = await IntegrationEvent.find({ status: "ERROR" })
      .sort({ createdAt: 1 })
      .limit(50);

    if (!failedEvents.length) {
      logger.info("[RETRY] Nenhum evento ERROR para reprocessar");
      return res.status(200).json({ success: true, message: "Nenhum retry necessário" });
    }

    logger.info(`[RETRY] Processando ${failedEvents.length} eventos falhados`);

    let successCount = 0;
    let failCount = 0;

    for (const event of failedEvents) {
      if (event.lastAttempt && (Date.now() - event.lastAttempt.getTime() < COOLDOWN_MINUTES * 60 * 1000)) {
        logger.warn(`Event ${event._id} em cooldown — pulando`);
        continue;
      }

      if (event.retryCount >= MAX_RETRIES) {
        await IntegrationEvent.findByIdAndUpdate(event._id, { status: "FAILED" });
        logger.error(`Event ${event._id} atingiu ${MAX_RETRIES} retries — marcado FAILED`);
        failCount++;
        continue;
      }

      try {
        const payload = event.payload;
        let execute;

        switch (event.entityType) {
          case "nota":
            execute = () => handleNotaFromPedido(payload);
            break;
          case "cliente":
            execute = () => handleClienteWebhook({ body: [payload] });
            break;
          case "pedido":
            execute = () => handlePedidoWebhook({ body: [payload] });
            break;
          default:
            throw new Error(`Tipo ${event.entityType} não suportado`);
        }

        await IntegrationEvent.findByIdAndUpdate(event._id, {
          status: "PROCESSING",
          lastAttempt: new Date(),
        });

        await processIntegrationEvent({ eventId: event._id, execute });

        await IntegrationEvent.findByIdAndUpdate(event._id, {
          status: "PROCESSED",
          error: null,
          retryCount: 0,
          lastAttempt: new Date(),
        });

        successCount++;
      } catch (err) {
        await IntegrationEvent.findByIdAndUpdate(event._id, {
          status: "ERROR",
          error: err.message,
          retryCount: (event.retryCount || 0) + 1,
          lastAttempt: new Date(),
        });

        failCount++;
        logger.error(`[RETRY] Falha no event ${event._id}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      processed: successCount,
      failed: failCount,
      total: failedEvents.length,
    });
  } catch (err) {
    logger.error(`[RETRY] Erro crítico na Vercel: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}
