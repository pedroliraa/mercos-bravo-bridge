import { mapNotaMercosToBravo } from "../mappers/mapNotaMercosToBravo.js";
import { mapNotaItemMercosToBravo } from "../mappers/mapNotaItemMercosToBravo.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import {
  consultarPrevendaParaFaturamento,
  consultarFaturamento,
  consultarFaturamentoItens,
} from "../services/easydata.service.js";
import {
  sendNotaToBravo,
  sendNotaItensToBravo,
} from "../services/bravo.service.js";
import logger from "../utils/logger.js";
import { consultarProdutosPorIds } from "../services/easydata.service.js";

export async function handleNotaFromPedido(pedido) {
  if (!pedido || !pedido.id) {
    logger.warn("⚠️ Nota não gerada: pedido inválido ou sem ID");
    return null;
  }

  const codigoNota = String(pedido.id);

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

  await processIntegrationEvent({
    eventId: integrationEvent._id,
    execute: async () => {
      const fkFaturamento = await consultarPrevendaParaFaturamento(
        pedido.representada_id,
        pedido.id
      );

      const faturamento = await consultarFaturamento(
        pedido.representada_id,
        fkFaturamento
      );

      const itensEasyData = await consultarFaturamentoItens(
        pedido.representada_id,
        fkFaturamento
      );

      const produtosIds = [
        ...new Set(itensEasyData.map(i => i.fk_produto).filter(Boolean))
      ];

      const produtos = await consultarProdutosPorIds(
        pedido.representada_id,
        produtosIds
      );

      //map de produtos por ID para fácil acesso
      const produtosMap = new Map(
        produtos.map(p => [p.pk, p])
      );

      notaMapeada = await mapNotaMercosToBravo(pedido, faturamento);

      if (notaMapeada.codigo_filial === "1" || notaMapeada.codigo_filial === "2") {

        itensMapeados = itensEasyData
          .map((item) => {
            const produto = produtosMap.get(item.fk_produto);
            return mapNotaItemMercosToBravo(item, pedido, produto);
          })

      }

      if (
        !notaMapeada ||
        !notaMapeada.codigo_filial ||
        !notaMapeada.codigo_nota ||
        !notaMapeada.total_nota
      ) {
        throw new Error("Nota mapeada incompleta");
      }

      await sendNotaToBravo(notaMapeada);

      if (notaMapeada.codigo_filial === "1" || notaMapeada.codigo_filial === "2") {

        if (itensMapeados.length > 0) {
          await sendNotaItensToBravo(itensMapeados);
        }
      }
    },
  });

  return notaMapeada;
}
