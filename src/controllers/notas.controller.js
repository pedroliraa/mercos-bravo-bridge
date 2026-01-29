// src/controllers/notas.controller.js
import { mapNotaMercosToBravo } from "../mappers/mapNotaMercosToBravo.js";
import { mapNotaItemMercosToBravo } from "../mappers/mapNotaItemMercosToBravo.js"; // novo mapper que criamos
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import {
  consultarPrevendaParaFaturamento,
  consultarFaturamento,
  consultarFaturamentoItens
} from "../services/easydata.service.js";
import {
  sendNotaToBravo,
  sendNotaItensToBravo  // Adicione essa função no bravo.service.js (veja abaixo)
} from "../services/bravo.service.js";
import logger from "../utils/logger.js";

/**
 * Controller interno chamado quando pedido.faturado chega
 * @param {Object} pedido - dados do pedido do Mercos
 * @returns {Object|null} - nota mapeada (para compatibilidade), mas o envio real acontece dentro do processor
 */
export async function handleNotaFromPedido(pedido) {
  if (!pedido || !pedido.id) {
    logger.warn("⚠️ Nota não gerada: pedido inválido ou sem ID");
    return null;
  }

  const codigoNota = String(pedido.id);

  logger.info(`🧾 Iniciando processamento de nota para pedido faturado: ${codigoNota}`);

  // Cria o evento de integração (igual aos pedidos)
  const integrationEvent = await IntegrationEvent.create({
    source: "mercos",
    entityType: "nota",
    entityId: codigoNota,
    eventType: "nota.faturada",
    payload: pedido,
    status: "PENDING",
  });

  let notaMapeada = null;
  let itensMapeados = [];

  // Processa dentro do processor (para retry automático em caso de falha)
  await processIntegrationEvent({
    eventId: integrationEvent._id,
    execute: async () => {
      logger.info(`[NOTA] Processando evento ${integrationEvent._id} - pedido ${codigoNota}`);

      // 1. Busca FK_FATURAMENTO na Prevenda
      const fkFaturamento = await consultarPrevendaParaFaturamento(pedido.representada_id, pedido.id);
      if (!fkFaturamento) {
        throw new Error(`FK_FATURAMENTO não encontrado na Prevenda para pedido ${pedido.id} (CHAVE=MERCOS_${pedido.id})`);
      }

      // 2. Consulta cabeçalho da nota
      const faturamento = await consultarFaturamento(pedido.representada_id, fkFaturamento);
      if (!faturamento) {
        throw new Error(`Faturamento não encontrado para FK=${fkFaturamento}`);
      }

      // 3. Consulta itens
      const itensEasyData = await consultarFaturamentoItens(pedido.representada_id, fkFaturamento);

      // 4. Mapeia nota e itens
      notaMapeada = mapNotaMercosToBravo(pedido, faturamento);
      itensMapeados = itensEasyData
        .map((item) => mapNotaItemMercosToBravo(item, pedido))
        .filter(Boolean);

      logger.info(`[NOTA] Nota mapeada: ${notaMapeada?.codigo_nota || '(sem código)'} | ${itensMapeados.length} itens`);

      // 5. Validação forte antes de enviar
      // Logo antes de await sendNotaToBravo(notaMapeada)
      if (!notaMapeada || !notaMapeada.codigo_filial || !notaMapeada.codigo_nota || !notaMapeada.total_nota) {
        logger.error(`[NOTA] Nota mapeada incompleta – NÃO enviando: ${JSON.stringify(notaMapeada)}`);
        throw new Error("Nota mapeada incompleta – campos obrigatórios faltando");
      }

      // 6. Envia
      await sendNotaToBravo(notaMapeada);
      logger.info(`✅ Nota enviada para Bravo: ${notaMapeada.codigo_nota}`);

      if (itensMapeados.length > 0) {
        await sendNotaItensToBravo(itensMapeados);
        logger.info(`✅ ${itensMapeados.length} tens de nota enviados para Bravo`);
      }
    },
  });

  // Retorna algo para compatibilidade com o controller de pedidos (opcional)
  return notaMapeada;
}