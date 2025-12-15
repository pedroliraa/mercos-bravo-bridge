// src/controllers/pedidos.controller.js

import {
  mapPedidoMercosToBravo,
  mapPedidoItensMercosToBravo,
} from "../mappers/mapPedidoMercosToBravo.js";

import { handleNotaFromPedido } from "./notas.controller.js";

import {
  sendPedidoToBravo,
  sendPedidoItensToBravo,
  sendNotaToBravo,
} from "../services/bravo.service.js";

import parseMercosPayload from "../services/mercosParser.service.js";
import logger from "../utils/logger.js";

export async function handlePedidoWebhook(req, res) {
  try {
    const eventos = parseMercosPayload(req.body, "pedido");

    const results = [];

    for (const item of eventos) {
      const { evento, dados } = item;

      logger?.info?.(`📥 Evento recebido (PEDIDO): ${evento}`);

      /* ======================
         PEDIDO
      ====================== */
      let pedidoMapeado = null;

      try {
        pedidoMapeado = mapPedidoMercosToBravo(evento, dados);

        if (pedidoMapeado) {
          await sendPedidoToBravo(pedidoMapeado);

          logger?.info?.(
            `✅ Pedido enviado: ${pedidoMapeado.codigo_pedido}`
          );
        }
      } catch (err) {
        logger?.error?.(
          `❌ Erro ao enviar pedido ${dados?.id}`,
          err
        );
      }

      /* ======================
         ITENS DO PEDIDO
      ====================== */
      let itensMapeados = [];

      try {
        itensMapeados = mapPedidoItensMercosToBravo(dados?.itens || []);

        if (itensMapeados.length) {
          await sendPedidoItensToBravo(itensMapeados);

          logger?.info?.(
            `✅ ${itensMapeados.length} item(ns) enviados`
          );
        }
      } catch (err) {
        logger?.error?.(
          `❌ Erro ao enviar itens do pedido ${dados?.id}`,
          err
        );
      }

      /* ======================
         NOTA (somente faturado)
      ====================== */
      let notaMapeada = null;

      if (evento === "pedido.faturado") {
        try {
          notaMapeada = handleNotaFromPedido(dados);

          if (notaMapeada) {
            await sendNotaToBravo(notaMapeada);

            logger?.info?.(
              `✅ Nota enviada: ${notaMapeada.codigo_nota}`
            );
          }
        } catch (err) {
          logger?.error?.(
            `❌ Erro ao enviar nota do pedido ${dados?.id}`,
            err
          );
        }
      }

      results.push({
        evento,
        pedido: pedidoMapeado,
        itens: itensMapeados,
        nota: notaMapeada,
      });
    }

    return res.status(200).json({
      ok: true,
      results,
    });
  } catch (err) {
    logger?.error?.("[ERRO PEDIDOS]:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro interno no processamento de pedidos",
    });
  }
}
