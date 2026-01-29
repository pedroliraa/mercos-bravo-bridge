import express from "express";

import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";

// Importa o retry diretamente (sem depender do router inteiro)
import IntegrationEvent from "../src/models/integrationEvent.model.js";
import { processIntegrationEvent } from "../src/processors/integration.processor.js";
import { handleNotaFromPedido } from "../src/controllers/notas.controller.js";
import { handleClienteWebhook } from "../src/controllers/clientes.controller.js";
import { handlePedidoWebhook } from "../src/controllers/pedidos.controller.js";
import logger from "../src/utils/logger.js";

import { connectMongo } from "../src/database/mongo.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

app.use(express.json({ limit: "5mb" }));

// Webhooks
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);

// Rota retry direto no app (sem router intermediário)
app.get("/api/retry-failed", async (req, res) => {
  try {
    const COOLDOWN_MINUTES = 5;
    const MAX_RETRIES = 3;

    const failedEvents = await IntegrationEvent.find({ status: "ERROR" })
      .sort({ createdAt: 1 })
      .limit(50);

    if (!failedEvents.length) {
      logger.info("[RETRY] Nenhum evento ERROR para reprocessar");
      return res.json({ success: true, message: "Nenhum retry necessário" });
    }

    logger.info(`[RETRY] Iniciando retry de ${failedEvents.length} eventos`);

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

// Ambiente local
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;