import {
    getPedidosComPaginacao
} from "../services/mercos.service.js";

import {
    sendCotacoesToBravo
} from "../services/bravo.service.js";

import mapPedidoMercosToBravoCotacao from "../mappers/mapPedidoMercosToBravoCotacao.js";

import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import logger from "../utils/logger.js";

import { resolveSellerByMercosId } from "../services/sellerResolver.js";
import { sendMarcaToBravo } from "../services/bravo.service.js";

// ======================================================
// 🔥 HELPER DE DATA
// ======================================================
function getDateMinutesAgo(minutes) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
}

// ======================================================
// 🔥 HELPER DE SITUAÇÃO (PADRÃO ÚNICO)
// ======================================================
function resolverSituacao(pedido) {
    const status = String(pedido.status);

    if (status === "0") return "CANCELADO";   // 🔥 CORREÇÃO PRINCIPAL
    if (status === "3") return "FATURADO";
    if (status === "2") return "GERADO";
    if (status === "1") return "ORCAMENTO";

    logger.info(
        `🧠 DEBUG STATUS → ID=${pedido.id} | status=${pedido.status}`
    );

    return "ORCAMENTO";
}

// ======================================================
// 🔥 CRON DE ORÇAMENTOS
// ======================================================
export async function handleWebhookOrcamentos(req, res) {
    try {
        logger.info("📑 [ORCAMENTOS] Cron iniciado");

        const alteradoApos = getDateMinutesAgo(190);

        logger.info(`[ORCAMENTOS] Buscando pedidos após: ${alteradoApos}`);

        const pedidos = await getPedidosComPaginacao(alteradoApos);

        if (!pedidos.length) {
            return res.json({ message: "Nenhum pedido encontrado" });
        }

        logger.info(`[ORCAMENTOS] Total pedidos encontrados: ${pedidos.length}`);

        const results = [];

        for (const pedido of pedidos) {

            const situacao = resolverSituacao(pedido);

            logger.info(
                `📊 [ORCAMENTOS] Pedido ${pedido.id} → situação: ${situacao}`
            );

            const integrationEvent = await IntegrationEvent.create({
                source: "mercos",
                entityType: "cotacao",
                entityId: pedido.id.toString(),
                eventType: "cotacao.sincronizada",
                payload: pedido,
                status: "PENDING",
            });

            await processIntegrationEvent({
                eventId: integrationEvent._id,
                execute: async () => {

                    try {
                        await enviarCotacaoFromPedido(pedido, situacao);

                        results.push({
                            cotacao: pedido.id,
                            status: situacao,
                        });

                    } catch (err) {
                        logger.error(
                            `❌ [ORCAMENTOS] Erro ao enviar cotação ${pedido.id}`,
                            err
                        );
                    }

                },
            });
        }

        return res.status(200).json({
            ok: true,
            enviados: results.length,
            results,
        });

    } catch (error) {
        logger.error("🔥 Erro no cron de orçamentos", error);
        return res.status(500).json({
            ok: false,
            error: "Erro ao sincronizar orçamentos",
        });
    }
}

// ======================================================
// 🔥 ENVIO DE COTAÇÃO (USADO PELO WEBHOOK E CRON)
// ======================================================
export async function enviarCotacaoFromPedido(pedido, situacaoCustom) {
    try {
        logger.info(
            `📑 [ORCAMENTOS] Preparando envio | Pedido ${pedido.id} | Situação: ${situacaoCustom}`
        );

        const seller = pedido?.criador_id
            ? await resolveSellerByMercosId(pedido.criador_id)
            : null;

        const codigoVendedorCRM = seller?.bravoSellerCode || "1";

        let cotacaoMapeada =
            mapPedidoMercosToBravoCotacao(pedido, codigoVendedorCRM);

        // 🔥 SOBRESCREVE A SITUAÇÃO
        cotacaoMapeada.situacao = situacaoCustom;

        logger.info(
            `[ORCAMENTOS] Payload final enviado: ${JSON.stringify(cotacaoMapeada, null, 2)}`
        );

        // 🔥 ENVIA APENAS COTAÇÃO (SEM ITENS)
        await sendCotacoesToBravo([cotacaoMapeada]);

        // 🔥 ENVIA MARCA
        if (pedido.cliente_cnpj) {
            await sendMarcaToBravo({
                codigo_cliente: pedido.cliente_cnpj.toString(),
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

        logger.info(`✅ [ORCAMENTOS] Cotação enviada com sucesso`);

        return true;

    } catch (error) {
        logger.error("🔥 Erro ao enviar cotação via pedido", error);
        throw error;
    }
}