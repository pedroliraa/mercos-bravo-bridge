import IntegrationEvent from "../models/integrationEvent.model.js";
import logger from "../utils/logger.js";

const COOLDOWN_MINUTES = 5;  // Não retry se última tentativa < 5 min
const MAX_RETRIES = 3;       // Depois de 3 falhas, marca FAILED

export async function processIntegrationEvent({ eventId, execute }) {
  const event = await IntegrationEvent.findById(eventId);
  if (!event) {
    logger.error(`Event ${eventId} não encontrado`);
    return;
  }

  // Cooldown
  if (event.lastAttempt && (Date.now() - event.lastAttempt.getTime() < COOLDOWN_MINUTES * 60 * 1000)) {
    logger.warn(`Event ${eventId} em cooldown — pulando`);
    return;
  }

  // Limite de retries
  if (event.retryCount >= MAX_RETRIES) {
    await IntegrationEvent.findByIdAndUpdate(eventId, { status: "FAILED" });
    logger.error(`Event ${eventId} atingiu ${MAX_RETRIES} retries — marcado FAILED`);
    return;
  }

  try {
    await IntegrationEvent.findByIdAndUpdate(eventId, {
      status: "PROCESSING",
      lastAttempt: new Date(),
    });

    await execute();

    await IntegrationEvent.findByIdAndUpdate(eventId, {
      status: "PROCESSED",
      error: null,
      retryCount: 0,
      lastAttempt: new Date(),
    });

    logger.info(`✅ Event ${eventId} processado com sucesso`);
  } catch (err) {
    await IntegrationEvent.findByIdAndUpdate(eventId, {
      status: "ERROR",
      error: err.message,
      retryCount: event.retryCount + 1,
      lastAttempt: new Date(),
    });

    logger.error(`❌ Event ${eventId} falhou (tentativa ${event.retryCount + 1}/${MAX_RETRIES})`, err);
    throw err;
  }
}