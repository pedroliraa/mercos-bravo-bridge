import mapPedidoMercosToBravo from "../mappers/mapPedidoMercosToBravo.js";
import { mapPedidoItemMercosToBravo } from "../mappers/mapPedidoItemMercosToBravo.js";
import { handleNotaFromPedido } from "./notas.controller.js";
import {
  sendPedidoToBravo,
  sendPedidoItensToBravo,
  sendNotaToBravo,
  sendMarcaToBravo,
} from "../services/bravo.service.js";
import { parseMercosPayload } from "../services/mercosParser.service.js";
import logger from "../utils/logger.js";

export async function handlePedidoWebhook(req, res) {
  try {
    logger.info("🧪 [PEDIDOS] Webhook recebido");
    logger.debug(`[PEDIDOS] Payload:\n${JSON.stringify(req.body, null, 2)}`);

    const eventos = parseMercosPayload(req.body, "pedido");
    const results = [];

    for (const item of eventos) {
      const { evento, dados } = item;
      logger.info(`🧪 [PEDIDOS] Processando: ${evento} | ID: ${dados?.id}`);

      let pedidoMapeado = null;
      let itensMapeados = [];
      let notaMapeada = null;

      try {
        // 1. Pedido
        pedidoMapeado = mapPedidoMercosToBravo(evento, dados);
        if (pedidoMapeado) {
          await sendPedidoToBravo(pedidoMapeado);
        }

        // 2. Itens do pedido
        itensMapeados = mapPedidoItemMercosToBravo(dados?.itens || []);
        if (itensMapeados.length > 0) {
          await sendPedidoItensToBravo(itensMapeados);
        }

        // 3. Vínculo marca (sempre, para garantir associação)
        try {
          const codigoVendedor = dados.criador_id?.toString() || "1";
          const codigoCliente = pedidoMapeado?.codigo_cliente || dados.cliente?.id?.toString();

          if (codigoCliente) {
            const marcaVinculo = {
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
            };
            await sendMarcaToBravo(marcaVinculo);
          }
        } catch (err) {
          logger?.error?.("❌ Erro ao enviar vínculo marca no pedido", err.message);
        }

        // 4. Nota (apenas se faturado)
        if (evento === "pedido.faturado") {
          notaMapeada = handleNotaFromPedido(dados);
          if (notaMapeada) {
            await sendNotaToBravo(notaMapeada);
          }
        }

        results.push({
          evento,
          pedido: pedidoMapeado,
          itens: itensMapeados.length,
          nota: notaMapeada ? "enviada" : null,
        });
      } catch (err) {
        logger.error("❌ Erro ao processar pedido", err);
        results.push({ evento, erro: err.message });
      }
    }

    logger.info("[PEDIDOS] Processamento concluído");
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    logger.error("🔥 Erro geral no webhook de pedidos", err);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  }
}