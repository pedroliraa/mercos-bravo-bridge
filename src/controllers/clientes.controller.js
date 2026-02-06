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

          // ================= VENDEDOR =================
          const codigoVendedorCRM = dados?.criador_id
            ? getCodigoVendedorCRM(dados.criador_id)
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

          logger.info("🔍 [CLIENTES] dados.contatos recebido do Mercos:");
          logger.info(JSON.stringify(dados.contatos, null, 2));

          // ================= CONTATOS =================
          logger.info("🔍 [CLIENTES] Iniciando processamento de contatos");

          let contatosMercos = Array.isArray(dados.contatos)
            ? dados.contatos
            : Array.isArray(dados?.contatos?.data)
              ? dados.contatos.data
              : [];

          // 🔧 FALLBACK: cria contato default a partir do cliente
          if (
            contatosMercos.length === 0 &&
            (dados.emails?.length || dados.telefones?.length)
          ) {
            logger.warn(
              "⚠️ [CLIENTES] Nenhum contato vindo do Mercos — criando contato default a partir do cliente"
            );

            contatosMercos = [
              {
                id: `cliente_${dados.id}`,
                nome:
                  dados.nome_fantasia ||
                  dados.razao_social ||
                  "Contato Principal",
                cargo: null,
                emails: dados.emails || [],
                telefones: dados.telefones || [],
                excluido: false,
              },
            ];
          }

          logger.info(
            `📌 [CLIENTES] contatosMercos normalizado: ${contatosMercos.length}`
          );
          logger.info(JSON.stringify(contatosMercos, null, 2));

          if (contatosMercos.length === 0) {
            logger.warn(
              "⚠️ [CLIENTES] Nenhum contato encontrado no payload — pulando envio"
            );
          } else {
            const idsContatos = contatosMercos
              .map((c) => c?.id)
              .filter(Boolean)
              .map(String);

            logger.info(
              `🧹 [CLIENTES] IDs de contatos para limpeza: ${idsContatos.join(
                ", "
              )}`
            );

            await deleteAllContatosFromBravo(
              dados.id.toString(),
              idsContatos
            );

            contatosMapped = contatosMercos
              .flatMap((c) => mapContatoMercosToBravo(c, dados))
              .filter(Boolean);

            logger.info(
              `🧩 [CLIENTES] contatos mapeados para Bravo: ${contatosMapped.length}`
            );
            logger.info(JSON.stringify(contatosMapped, null, 2));

            if (contatosMapped.length > 0) {
              await sendContatosToBravo(contatosMapped);
            } else {
              logger.warn("⚠️ [CLIENTES] Mapper retornou array vazio");
            }
          }
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