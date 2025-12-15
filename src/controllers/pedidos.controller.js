// src/controllers/pedidos.controller.js

import {
  mapPedidoMercosToBravo,
  mapPedidoItensMercosToBravo,
} from "../mappers/mapPedidoMercosToBravo.js";

import { handleNotaFromPedido } from "./notas.controller.js";
import logger from "../utils/logger.js";

export async function handlePedidoWebhook(req, res) {
  try {
    const eventos = req.body;

    if (!Array.isArray(eventos)) {
      logger?.warn?.("Payload pedido não é array");
      return res.status(400).json({ error: "Payload inválido" });
    }

    const results = [];

    for (const item of eventos) {
      const evento = item.evento;
      const dados = item.dados || {};

      logger?.info?.(`📥 Evento recebido (PEDIDO): ${evento}`);

      // ----------------------
      // Pedido
      // ----------------------
      const pedidoMapeado = mapPedidoMercosToBravo(evento, dados);

      // ----------------------
      // Itens do pedido
      // ----------------------
      const itensMapeados = mapPedidoItensMercosToBravo(dados.itens || []);

      // ----------------------
      // Nota (somente faturado)
      // ----------------------
      let notaMapeada = null;

      if (evento === "pedido.faturado") {
        notaMapeada = handleNotaFromPedido(dados);
      }

      logger?.info?.(
        `📤 Pedido ${pedidoMapeado?.codigo_pedido} | Itens: ${itensMapeados.length} | Nota: ${
          notaMapeada ? "gerada" : "não"
        }`
      );

      results.push({
        evento,
        pedido: pedidoMapeado,
        itens: itensMapeados,
        nota: notaMapeada,
      });
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("[ERRO PEDIDOS]:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
