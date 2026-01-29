import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.use("/clientes", clientesRoute);
router.use("/pedidos", pedidosRoute);

// Rota de retry manual (já existe, só ajustamos pra ter retryCount e cooldown)
router.get("/api/retry-failed", async (req, res) => {
  try {
    // Busca events ERROR, ordenados por createdAt (antigos primeiro), limite 20
    const failedEvents = await IntegrationEvent.find({ status: "ERROR" })
      .sort({ createdAt: 1 })
      .limit(20);

    if (!failedEvents.length) {
      logger.info("[RETRY] Nenhum evento ERROR para reprocessar");
      return res.json({ success: true, message: "Nenhum retry necessário" });
    }

    logger.info(`[RETRY] Iniciando retry de ${failedEvents.length} eventos`);

    let successCount = 0;
    let failCount = 0;

    for (const event of failedEvents) {
      // Cooldown: não retry se última tentativa < 5 minutos
      if (event.lastAttempt && (Date.now() - event.lastAttempt.getTime() < 5 * 60 * 1000)) {
        logger.warn(`Event ${event._id} em cooldown — pulando`);
        continue;
      }

      // Limite de 3 tentativas
      if (event.retryCount >= 3) {
        await IntegrationEvent.findByIdAndUpdate(event._id, { status: "FAILED" });
        logger.error(`Event ${event._id} atingiu 3 retries — marcado FAILED`);
        failCount++;
        continue;
      }

      try {
        // Reconstrução simples do execute (só nota por enquanto, adicione outros tipos depois)
        const payload = event.payload;
        const execute = () => handleNotaFromPedido(payload); // ajuste se tiver outros handlers

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

    res.json({
      success: true,
      processed: successCount,
      failed: failCount,
      total: failedEvents.length,
    });
  } catch (err) {
    logger.error(`[RETRY] Erro na rota retry-failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;