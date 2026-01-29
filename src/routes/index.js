import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";

// Importa os handlers reais (ajuste paths se necessário)
import { handleNotaFromPedido } from "../controllers/notas.controller.js";
import { handleClienteWebhook } from "../controllers/clientes.controller.js";
import { handlePedidoWebhook } from "../controllers/pedidos.controller.js";

import logger from "../utils/logger.js";

const router = express.Router();

// Rotas de webhook (já estão no index.js, mas se quiser manter aqui também)
router.use("/clientes", clientesRoute);
router.use("/pedidos", pedidosRoute);

// Rota de retry funcional
router.get("/api/retry-failed", async (req, res) => {
  try {
    const COOLDOWN_MINUTES = 5;
    const MAX_RETRIES = 3;

    const failedEvents = await IntegrationEvent.find({ status: "ERROR" })
      .sort({ createdAt: 1 })
      .limit(50); // Aumentei pra 50 pra limpar mais rápido

    if (!failedEvents.length) {
      logger.info("[RETRY] Nenhum evento ERROR para reprocessar");
      return res.json({ success: true, message: "Nenhum retry necessário" });
    }

    logger.info(`[RETRY] Iniciando retry de ${failedEvents.length} eventos`);

    let successCount = 0;
    let failCount = 0;

    for (const event of failedEvents) {
      // Cooldown
      if (event.lastAttempt && (Date.now() - event.lastAttempt.getTime() < COOLDOWN_MINUTES * 60 * 1000)) {
        logger.warn(`Event ${event._id} em cooldown — pulando`);
        continue;
      }

      // Limite de retries
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
            execute = () => handleClienteWebhook({ body: [payload] }); // simula o array do webhook
            break;
          case "pedido":
            execute = () => handlePedidoWebhook({ body: [payload] }); // simula o array do webhook
            break;
          default:
            throw new Error(`Tipo ${event.entityType} não suportado para retry`);
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

    // Cleanup opcional: deleta PROCESSED > 7 dias (comente se não quiser)
    await IntegrationEvent.deleteMany({
      status: "PROCESSED",
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    logger.info("[RETRY] Cleanup: eventos PROCESSED antigos deletados");

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