import mapClienteMercosToBravo from "../mappers/mapClienteMercosToBravo.js";
import mapContatoMercosToBravo from "../mappers/mapContatoMercosToBravo.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import {
  sendClienteToBravo,
  sendContatosToBravo,
  sendMarcaToBravo,
  deleteClienteFromBravo,
  deleteAllContatosFromBravo,
  deleteMarcaFromBravo,
} from "../services/bravo.service.js";
import logger from "../utils/logger.js";

// 🔹 IMPORTA A REGRA OFICIAL DE VENDEDOR (MESMA DO PEDIDO)
import { getCodigoVendedorCRM } from "../mappers/mapClienteMercosToBravo.js";

// 🔹 Normalização simples: aceita objeto ou lista
const normalizeToArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

export const handleClienteWebhook = async (req, res) => {
  try {
    logger.info("📥 [CLIENTES] Webhook recebido");

    const eventos = normalizeToArray(req.body);

    if (!eventos.length) {
      return res.status(400).json({
        ok: false,
        error: "Payload inválido: esperado objeto ou lista de eventos",
      });
    }

    const results = [];

    for (const ev of eventos) {
      const tipo = ev?.evento;
      const dados = ev?.dados || {};

      const integrationEvent = await IntegrationEvent.create({
        source: "mercos",
        entityType: "cliente",
        entityId: dados.id?.toString(),
        eventType: tipo,
        payload: ev,
        status: "PENDING",
      });

      await processIntegrationEvent({
        eventId: integrationEvent._id,
        execute: async () => {
          let clienteMapped = null;
          let contatosMapped = [];

          if (tipo === "cliente.excluido") {
            const codigo_cliente = dados.id.toString();
            await deleteClienteFromBravo(codigo_cliente);
            await deleteMarcaFromBravo({ codigo_cliente, codigo_marca: "1" });
            await deleteAllContatosFromBravo(codigo_cliente, []);
            return;
          }

          // ================= CLIENTE =================
          const dadosSemContatos = { ...dados };
          delete dadosSemContatos.contatos;

          clienteMapped = mapClienteMercosToBravo(dadosSemContatos);

          if (clienteMapped?.codigo_cliente) {
            await sendClienteToBravo(clienteMapped);
          }

          // ================= VENDEDOR (CORRETO) =================
          const codigoVendedorCRM =
            dados?.criador_id && dados?.representada_id
              ? getCodigoVendedorCRM(dados.representada_id, dados.criador_id)
              : "1";

          // ================= MARCA =================
          await sendMarcaToBravo({
            codigo_cliente: dados.id.toString(),
            codigo_marca: "1",
            codigo_vendedor: codigoVendedorCRM,
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

          // ================= CONTATOS =================
          if (Array.isArray(dados.contatos)) {
            const idsContatos = dados.contatos.map((c) => c.id.toString());

            await deleteAllContatosFromBravo(
              dados.id.toString(),
              idsContatos
            );

            contatosMapped = dados.contatos
              .flatMap((c) => mapContatoMercosToBravo(c, dados))
              .filter(Boolean);

            if (contatosMapped.length > 0) {
              await sendContatosToBravo(contatosMapped);
            }
          }

          results.push({
            evento: tipo,
            cliente: clienteMapped,
            vendedor: codigoVendedorCRM,
            contatos: contatosMapped.length,
          });
        },
      });

      logger.info(`[CLIENTES] Evento "${tipo}" finalizado`);
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    logger.error("🔥 [CLIENTES] Erro geral no controller", err);
    return res.status(500).json({
      ok: false,
      error: "Erro interno no processamento de clientes",
    });
  }
};
