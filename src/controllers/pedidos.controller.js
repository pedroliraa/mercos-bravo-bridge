import mapPedidoMercosToBravo from "../mappers/mapPedidoMercosToBravo.js";
import { mapPedidoItemMercosToBravo } from "../mappers/mapPedidoItemMercosToBravo.js";
import { handleNotaFromPedido } from "./notas.controller.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import {
  sendPedidoToBravo,
  sendPedidoItensToBravo,
  sendNotaToBravo,
  sendMarcaToBravo,
  deletePedidoFromBravo,
  deleteNotaFromBravo,
} from "../services/bravo.service.js";
import { parseMercosPayload } from "../services/mercosParser.service.js";
import logger from "../utils/logger.js";

export async function handlePedidoWebhook(req, res) {
  try {
    logger.info("🧪 [PEDIDOS] Webhook recebido");
    logger.info(`[PEDIDOS] Payload:\n${JSON.stringify(req.body, null, 2)}`);

    const eventos = parseMercosPayload(req.body, "pedido");
    const results = [];

    for (const item of eventos) {
      const { evento, dados } = item;

      const integrationEvent = await IntegrationEvent.create({
        source: "mercos",
        entityType: "pedido",
        entityId: dados?.id?.toString(),
        eventType: evento,
        payload: item,
        status: "PENDING",
      });

      await processIntegrationEvent({
        eventId: integrationEvent._id,
        execute: async () => {
          logger.info(`🧪 [PEDIDOS] Processando: ${evento} | ID: ${dados?.id}`);

          /* ======================================================
             CANCELAMENTO → DELETE
          ====================================================== */
          if (evento === "pedido.cancelado") {
            const codigoPedido = String(dados.id);

            await deleteNotaFromBravo({
              codigo_filial: "1",
              codigo_nota: codigoPedido,
              codigo_marca: "1",
            });

            logger.info(`🗑️ Nota cancelada no Bravo: ${codigoPedido}`);

            await deletePedidoFromBravo({
              codigo_filial: "1",
              codigo_pedido: codigoPedido,
              codigo_marca: "1",
            });

            logger.info(`🗑️ Pedido cancelado no Bravo: ${codigoPedido}`);

            results.push({ evento, pedido: "cancelado" });
            return;
          }

          /* ======================================================
             PEDIDO
          ====================================================== */
          const pedidoMapeado = mapPedidoMercosToBravo(evento, dados);
          if (pedidoMapeado) {
            await sendPedidoToBravo(pedidoMapeado);
            logger.info(`✅ Pedido enviado: ${pedidoMapeado.codigo_pedido}`);
          }

          /* ======================================================
             ITENS
          ====================================================== */
          const itensMapeados = (dados?.itens || []).map(item =>
            mapPedidoItemMercosToBravo(item, dados)
          );

          if (itensMapeados.length > 0) {
            await sendPedidoItensToBravo(itensMapeados);
            logger.info(`✅ Itens enviados: ${itensMapeados.length}`);
          }

          /* ======================================================
             MARCA
          ====================================================== */
          const codigoVendedor = dados.criador_id?.toString() || "1";
          const codigoCliente =
            pedidoMapeado?.codigo_cliente ||
            dados.cliente_id?.toString();

          if (codigoCliente) {
            await sendMarcaToBravo({
              codigo_cliente: codigoCliente,
              codigo_marca: "1",
              codigo_vendedor: codigoVendedor,
              codigo_vendedor2: "",
              codigo_gestor: "",
              restricao: "",
              categoria_carteira: "",
              marca_campo_1: "",
              marca_campo_2: "",
              marca_campo_3: "",
              marca_campo_4: "",
              marca_campo_5: "",
            });

            logger.info(`✅ Vínculo marca enviado (${codigoCliente})`);
          }

          /* ======================================================
             NOTA
          ====================================================== */
          if (evento === "pedido.faturado") {
            const notaMapeada = handleNotaFromPedido(dados);
            if (notaMapeada) {
              await sendNotaToBravo(notaMapeada);
              logger.info("✅ Nota enviada");
            }
          }

          results.push({
            evento,
            pedido: "enviado",
            itens: itensMapeados.length,
          });
        },
      });
    }

    logger.info("[PEDIDOS] Processamento concluído");
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    logger.error("🔥 Erro geral no webhook de pedidos", err);
    return res.status(500).json({ ok: false });
  }
}
