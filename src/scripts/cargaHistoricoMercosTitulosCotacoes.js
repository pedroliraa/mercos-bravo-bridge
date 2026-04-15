import mongoose from "mongoose";
import { env } from "../config/env.js";

import logger from "../utils/logger.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";

import {
  getPedidosComPaginacao,
  getTitulosComPaginacao
} from "../services/mercos.service.js";

import {
  sendFaturasToBravo,
  sendCotacoesToBravo,
  sendCotacaoItensToBravo
} from "../services/bravo.service.js";

import mapTituloMercosToBravo from "../mappers/mapTituloMercosToBravo.js";
import mapPedidoMercosToBravoCotacao from "../mappers/mapPedidoMercosToBravoCotacao.js";
import mapItensParaCotacaoItemBravo from "../mappers/mapPedidoMercosToBravoCotacaoItem.js";

import { getCnpjByMercosClienteId } from "../services/clienteMongo.service.js";
import { resolveSellerByMercosId } from "../services/sellerResolver.js";

async function cargaHistorica() {
  try {
    logger.info("🚀 [CARGA] Iniciando carga histórica Mercos → CRM");

    await mongoose.connect(env.MONGO_URI);
    logger.info("✅ [CARGA] Mongo conectado");

    const dataInicio = "2026-02-01 00:00:00";
    const dataFim = new Date("2026-03-12T08:00:00");

    // ================= TITULOS =================
    logger.info("🧾 [CARGA] Buscando títulos...");

    const titulos = await getTitulosComPaginacao(dataInicio);

    logger.info(`📊 [CARGA] ${titulos.length} títulos retornados`);

    let titulosProcessados = 0;

    for (const titulo of titulos) {
      try {
        if (new Date(titulo.ultima_alteracao) > dataFim) continue;
        if (titulo.excluido) continue;

        logger.info(`🧾 [CARGA] Processando título ${titulo.id}`);

        const integrationEvent = await IntegrationEvent.create({
          source: "mercos",
          entityType: "titulo",
          entityId: titulo.id.toString(),
          eventType: "titulo.carga_historica",
          payload: titulo,
          status: "PENDING",
        });

        await processIntegrationEvent({
          eventId: integrationEvent._id,
          execute: async () => {

            let cnpj = "";

            if (titulo.cliente_id) {
              const cliente = await getCnpjByMercosClienteId(titulo.cliente_id);
              cnpj = cliente?.toString().replace(/\D/g, "") || "";
            }

            const tituloMapeado =
              mapTituloMercosToBravo(titulo, cnpj);

            logger.info(
              `🧾 [CARGA] Título ${titulo.id} mapeado`
            );

            await sendFaturasToBravo([tituloMapeado]);

            logger.info(
              `✅ [CARGA] Título ${titulo.id} enviado`
            );
          },
        });

        titulosProcessados++;

      } catch (err) {
        logger.error(
          `❌ [CARGA] Erro no título ${titulo.id}: ${err.message}`
        );
      }
    }

    // ================= COTAÇÕES =================
    logger.info("📑 [CARGA] Buscando pedidos...");

    const pedidos = await getPedidosComPaginacao(dataInicio);

    logger.info(`📊 [CARGA] ${pedidos.length} pedidos retornados`);

    const orcamentos = pedidos.filter(p => String(p.status) === "1");

    logger.info(`📊 [CARGA] ${orcamentos.length} orçamentos filtrados`);

    let cotacoesProcessadas = 0;

    for (const pedido of orcamentos) {
      try {
        if (new Date(pedido.ultima_alteracao) > dataFim) continue;

        logger.info(`📑 [CARGA] Processando cotação ${pedido.id}`);

        const integrationEvent = await IntegrationEvent.create({
          source: "mercos",
          entityType: "cotacao",
          entityId: pedido.id.toString(),
          eventType: "cotacao.carga_historica",
          payload: pedido,
          status: "PENDING",
        });

        await processIntegrationEvent({
          eventId: integrationEvent._id,
          execute: async () => {

            const seller = pedido?.criador_id
              ? await resolveSellerByMercosId(pedido.criador_id)
              : null;

            const codigoVendedorCRM = seller?.bravoSellerCode || "1";

            const cotacaoMapeada =
              mapPedidoMercosToBravoCotacao(pedido, codigoVendedorCRM);

            const itensMapeados =
              mapItensParaCotacaoItemBravo(pedido, {});

            logger.info(
              `📑 [CARGA] Cotação ${pedido.id} mapeada`
            );

            await sendCotacoesToBravo([cotacaoMapeada]);

            if (itensMapeados.length) {
              await sendCotacaoItensToBravo(itensMapeados);
            }

            logger.info(
              `✅ [CARGA] Cotação ${pedido.id} enviada`
            );
          },
        });

        cotacoesProcessadas++;

      } catch (err) {
        logger.error(
          `❌ [CARGA] Erro na cotação ${pedido.id}: ${err.message}`
        );
      }
    }

    logger.info("🎉 [CARGA] Finalizada com sucesso");
    logger.info(`🧾 Títulos processados: ${titulosProcessados}`);
    logger.info(`📑 Cotações processadas: ${cotacoesProcessadas}`);

    process.exit(0);

  } catch (error) {
    logger.error("🔥 [CARGA] Erro geral", error);
    process.exit(1);
  }
}

cargaHistorica();