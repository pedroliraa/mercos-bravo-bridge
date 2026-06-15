// pedidos.sync.controller.js

import {
  getPedidosComPaginacao
} from "../services/mercos.service.js";

import mapPedidoMercosToBravo from "../mappers/mapPedidoMercosToBravo.js";

import {
  mapPedidoItemMercosToBravo
} from "../mappers/mapPedidoItemMercosToBravo.js";

import {
  sendPedidoToBravo,
  sendPedidoItensToBravo,
  sendNotaToBravo,
  sendMarcaToBravo,
} from "../services/bravo.service.js";

import { handleNotaFromPedido } from "./notas.controller.js";

import IntegrationEvent from "../models/integrationEvent.model.js";

import { processIntegrationEvent } from "../processors/integration.processor.js";

import logger from "../utils/logger.js";

import { resolveSellerByMercosId } from "../services/sellerResolver.js";

import Cliente from "../models/integrationClient.model.js";

import { handleClienteWebhook } from "./clientes.controller.js";

// ======================================================
// DATA
// ======================================================

function getDateMinutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);

  return date.toISOString();
}

// ======================================================
// GARANTIR CLIENTE
// ======================================================

async function garantirClienteExiste(dadosPedido) {
  const cnpj = dadosPedido?.cliente_cnpj?.toString();

  if (!cnpj) {
    logger.warn("⚠️ Pedido sem CNPJ");
    return null;
  }

  let cliente = await Cliente.findOne({ cnpj });

  if (cliente) {
    return cliente;
  }

  const clientePayload = {
    evento: "cliente.cadastrado",
    dados: {
      id: dadosPedido.cliente_id,
      cnpj,
      razao_social: dadosPedido.cliente_razao_social,
      nome_fantasia: dadosPedido.cliente_nome_fantasia,
      inscricao_estadual: dadosPedido.cliente_inscricao_estadual,
      cep: dadosPedido.cliente_cep,
      rua: dadosPedido.cliente_rua,
      numero: dadosPedido.cliente_numero,
      complemento: dadosPedido.cliente_complemento,
      bairro: dadosPedido.cliente_bairro,
      cidade: dadosPedido.cliente_cidade,
      estado: dadosPedido.cliente_estado,
      emails: (dadosPedido.cliente_email || []).map(e => ({ email: e })),
      telefones: (dadosPedido.cliente_telefone || []).map(t => ({ numero: t })),
      criador_id: dadosPedido.criador_id,
      data_criacao: dadosPedido.data_criacao,
      ultima_alteracao: dadosPedido.ultima_alteracao
    }
  };

  const fakeReq = { body: clientePayload };
  const fakeRes = { status: () => ({ json: () => { } }) };

  await handleClienteWebhook(fakeReq, fakeRes);

  return await Cliente.findOne({ cnpj });
}

// ======================================================
// CRON PEDIDOS
// ======================================================

export async function syncPedidosAlterados(req, res) {
  try {

    logger.info("🚀 [PEDIDOS_SYNC] Iniciando sincronização");

    //const alteradoApos = getDateMinutesAgo(10);
    //const alteradoApos = getDateMinutesAgo(1440);
    const alteradoApos = getDateMinutesAgo(190);

    logger.info(
      `[PEDIDOS_SYNC] Buscando pedidos alterados após ${alteradoApos}`
    );

    // status=2 => SOMENTE PEDIDOS
    const pedidos = await getPedidosComPaginacao(
      alteradoApos,
      2
    );

    if (!pedidos.length) {
      return res.status(200).json({
        ok: true,
        message: "Nenhum pedido alterado encontrado"
      });
    }

    logger.info(
      `[PEDIDOS_SYNC] ${pedidos.length} pedidos encontrados`
    );

    const results = [];

    for (const pedido of pedidos) {

      const integrationEvent = await IntegrationEvent.create({
        source: "mercos",
        entityType: "pedido",
        entityId: pedido.id.toString(),
        eventType: "pedido.sincronizado",
        payload: pedido,
        status: "PENDING",
      });

      await processIntegrationEvent({
        eventId: integrationEvent._id,

        execute: async () => {

          logger.info(
            `📦 [PEDIDOS_SYNC] Processando pedido ${pedido.id}`
          );

          // ================= CLIENTE =================

          await garantirClienteExiste(pedido);

          // ================= PEDIDO =================

          const pedidoMapeado =
            await mapPedidoMercosToBravo(
              "pedido.sincronizado",
              pedido
            );

          if (pedidoMapeado?.codigo_cliente) {
            await sendPedidoToBravo(pedidoMapeado);
          } else {
            logger.warn(
              `⚠️ [PEDIDOS_SYNC] Pedido ${pedido.id} ignorado: sem codigo_cliente`
            );
          }

          // ================= ITENS =================

          const itensMapeados = (pedido?.itens || []).map((item) =>
            mapPedidoItemMercosToBravo(item, pedido)
          );

          if (itensMapeados.length > 0) {
            await sendPedidoItensToBravo(itensMapeados);
          }

          // ================= VENDEDOR =================

          const seller = pedido?.criador_id
            ? await resolveSellerByMercosId(pedido.criador_id)
            : null;

          const codigoVendedorCRM =
            seller?.bravoSellerCode || "1";

          // ================= MARCA =================

          const codigoCliente =
            pedidoMapeado?.codigo_cliente ||
            pedido.cliente_cnpj?.toString();

          if (!codigoCliente) {
            logger.warn(
              `⚠️ [PEDIDOS_SYNC] Marca ignorada no pedido ${pedido.id}: sem codigo_cliente`
            );
          } else {

            await sendMarcaToBravo({
              codigo_cliente: codigoCliente,
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

          }

          // ================= NOTA =================

          // status_faturamento = 2 => faturado
          if (String(pedido.status_faturamento) === "2") {

            const notaMapeada =
              await handleNotaFromPedido(pedido);

            if (notaMapeada) {
              await sendNotaToBravo(notaMapeada);
            }

          }

          results.push({
            pedido: pedido.id,
            itens: itensMapeados.length,
            status: "sincronizado"
          });

        },
      });

    }

    return res.status(200).json({
      ok: true,
      enviados: results.length,
      results,
    });

  } catch (error) {

    logger.error(
      "🔥 [PEDIDOS_SYNC] Erro na sincronização",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Erro ao sincronizar pedidos"
    });

  }
}