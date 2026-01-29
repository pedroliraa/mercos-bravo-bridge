import IntegrationEvent from "../models/integrationEvent.model.js";
import { integrationHandlers } from "./handlers/index.js";
import logger from "../utils/logger.js";

export async function retryFailedEvents() {
  const events = await IntegrationEvent.find({ status: "ERROR" });

  for (const event of events) {
    const handler = integrationHandlers[event.eventType];

    if (!handler) {
      logger.warn(`⚠️ Sem handler para ${event.eventType}`);
      continue;
    }

    try {
      await handler({
        eventType: event.eventType,
        payload: event.payload,
      });

      event.status = "PROCESSED";
      event.error = null;
      await event.save();

      logger.info(`🔁 Retry OK: ${event._id}`);
    } catch (err) {
      event.error = err.message;
      await event.save();

      logger.error(`❌ Retry falhou: ${event._id}`, err);
    }
  }
}

