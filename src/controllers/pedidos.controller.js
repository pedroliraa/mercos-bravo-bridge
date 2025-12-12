// src/controllers/pedidos.controller.js

import {
  mapPedidoMercosToBravo,
  mapPedidoItensMercosToBravo,
} from "../mappers/mapPedidoMercosToBravo.js";

export async function handlePedidoWebhook(req, res) {
  try {
    const eventos = req.body;

    if (!Array.isArray(eventos)) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    const results = [];

    for (const item of eventos) {
      const evento = item.evento;
      const dados = item.dados;

      console.info(`[INFO]: 📥 Evento recebido (PEDIDO): ${evento}`);

      const pedidoMapeado = mapPedidoMercosToBravo(evento, dados);
      const itensMapeados = mapPedidoItensMercosToBravo(dados.itens);

      console.info(
        `[INFO]: 📤 Pedido mapeado: ${pedidoMapeado.codigo_pedido}, itens: ${itensMapeados.length}`
      );

      results.push({
        evento,
        pedido: pedidoMapeado,
        itens: itensMapeados,
      });
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("[ERRO PEDIDOS]:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
