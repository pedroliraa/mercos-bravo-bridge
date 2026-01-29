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

export const handleClienteWebhook = async (req, res) => {
  try {
    logger?.info("📥 [CLIENTES] Webhook recebido");

    const eventos = req.body;

    if (!Array.isArray(eventos)) {
      return res.status(400).json({
        ok: false,
        error: "Payload deve ser uma lista de eventos",
      });
    }

    const results = [];

    for (let i = 0; i < eventos.length; i++) {
      const ev = eventos[i];
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
          } else {
            // Cliente
            const dadosSemContatos = { ...dados };
            delete dadosSemContatos.contatos;

            clienteMapped = mapClienteMercosToBravo(dadosSemContatos);
            if (clienteMapped?.codigo_cliente) {
              await sendClienteToBravo(clienteMapped);
            }

            // Marca
            const marcaVinculo = {
              codigo_cliente: dados.id.toString(),
              codigo_marca: "1",
              codigo_vendedor: dados.criador_id?.toString() || "1",
            };

            await sendMarcaToBravo(marcaVinculo);

            // Contatos
            if (Array.isArray(dados.contatos)) {
              const idsContatos = dados.contatos.map(c => c.id.toString());
              await deleteAllContatosFromBravo(dados.id.toString(), idsContatos);

              contatosMapped = dados.contatos
                .flatMap(c => mapContatoMercosToBravo(c, dados))
                .filter(Boolean);

              if (contatosMapped.length > 0) {
                await sendContatosToBravo(contatosMapped);
              }
            }
          }

          results.push({
            evento: tipo,
            cliente: clienteMapped,
            contatos: contatosMapped,
          });
        },
      });

      logger?.info(`[CLIENTES] Evento "${tipo}" finalizado`);
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    logger?.error("🔥 [CLIENTES] Erro geral no controller", err);
    return res.status(500).json({
      ok: false,
      error: "Erro interno no processamento de clientes",
    });
  }
};
