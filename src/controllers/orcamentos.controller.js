import {
    getPedidosComPaginacao,
    getClienteById
} from "../services/mercos.service.js";

import {
    sendCotacoesToBravo,
    sendCotacaoItensToBravo
} from "../services/bravo.service.js";

import mapPedidoMercosToBravoCotacao from "../mappers/mapPedidoMercosToBravoCotacao.js";
import mapItensParaCotacaoItemBravo from "../mappers/mapPedidoMercosToBravoCotacaoItem.js";

import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import logger from "../utils/logger.js";

import { resolveSellerByMercosId } from "../services/sellerResolver.js";
import { sendMarcaToBravo } from "../services/bravo.service.js";

function getDateMinutesAgo(minutes) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
}

export async function handleWebhookOrcamentos(req, res) {
    try {
        logger.info("📑 [ORCAMENTOS] Cron iniciado");

        const alteradoApos = getDateMinutesAgo(190); // 3 horas atrás
        //const alteradoApos = "2026-01-01T00:00:00.000Z"; // <-- para testes, pega tudo

        console.log(`[ORCAMENTOS] Buscando pedidos alterados após: ${alteradoApos}`);

        const pedidos = await getPedidosComPaginacao(alteradoApos);

        if (!pedidos.length) {
            return res.json({ message: "Nenhum pedido encontrado" });
        }

        console.log(`[ORCAMENTOS] Payload Pedidos: ${JSON.stringify(pedidos, null, 2)}`);

        const orcamentos = pedidos.filter(p => String(p.status) === "1");

        if (!orcamentos.length) {
            return res.json({ message: "Nenhum orçamento encontrado" });
        }

        const results = [];

        for (const pedido of orcamentos) {

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

                    logger.info(`📑 Processando orçamento ${pedido.id}`);

                    // 🔥 Buscar cliente para obter CNPJ
                    let cnpj = "";

                    /*if (pedido.cliente_id) {
                        console.log(`[MERCOS] 🔹 Tentando buscar cliente para ID: ${pedido.cliente_id}`);

                        let cliente;
                        try {
                            cliente = await getClienteById(pedido.cliente_id);
                        } catch (err) {
                            console.error(`[MERCOS] ❌ Erro ao buscar cliente ${pedido.cliente_id}:`, err.message);
                            cliente = null;
                        }

                        if (!cliente) {
                            console.warn(`[MERCOS] ⚠️ Cliente ${pedido.cliente_id} retornou vazio ou não existe`);
                        } else {
                            console.log(`[MERCOS] ✅ Cliente ${pedido.cliente_id} retornou:`, cliente);
                        }

                        const cnpj = cliente?.cnpj?.replace(/\D/g, "") || "";
                        console.log(`[MERCOS] 📝 CNPJ processado: ${cnpj}`);
                    }*/

                    // 🔥 Mapear Cotação

                    console.log(`[ORCAMENTOS] CNPJ do cliente: ${pedido.cliente_cnpj}`);

                    const seller = pedido?.criador_id
                        ? await resolveSellerByMercosId(pedido.criador_id)
                        : null;


                    // ================= VENDEDOR =================
                    const codigoVendedorCRM = seller?.bravoSellerCode || "1";

                    const cotacaoMapeada =
                        mapPedidoMercosToBravoCotacao(pedido, codigoVendedorCRM);

                    logger.info(
                        `[ORCAMENTOS] Orçamento ${pedido.id} mapeado: ${JSON.stringify(cotacaoMapeada, null, 2)}`
                    );

                    // 🔥 Mapear Itens da Cotação
                    // (aqui você precisa ter produtosMap previamente montado)
                    const produtosMap = {}; // <-- preencher se necessário

                    const itensMapeados =
                        mapItensParaCotacaoItemBravo(pedido, produtosMap);

                    logger.info(
                        `[ORCAMENTOS] Orçamento ${pedido.id} mapeado. Itens mapeados: ${JSON.stringify(itensMapeados, null, 2)}`
                    );

                    // 🔥 Enviar Cotação
                    await sendCotacoesToBravo([cotacaoMapeada]);

                    // 🔥 Enviar Itens da Cotação
                    if (itensMapeados.length) {
                        await sendCotacaoItensToBravo(itensMapeados);
                    }

                    // ================= MARCA =================
                    //const shouldSendMarca = tipo === "cotacao.enviada";

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

                        logger.info(`🏷️ [ORÇAMENTOS] Marca enviada (evento: cotacao.enviada)`);
                    } else {
                        logger.info(`⏭️ [ORÇAMENTOS] Marca ignorada (evento: cotacao.enviada)`);
                    }

                    results.push({
                        cotacao: pedido.id,
                        status: "enviado",
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
        logger.error("Erro ao sincronizar orçamentos", error);
        return res.status(500).json({
            ok: false,
            error: "Erro ao sincronizar orçamentos",
        });
    }
}