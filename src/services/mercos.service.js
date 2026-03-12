import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import createMercosApi from "./mercosApi.js";

/**
 * Formata data no padrão aceito pela API v2 da Mercos:
 * YYYY-MM-DD HH:mm:ss
 */
function formatMercosDate(date) {
    if (!date) return null;

    return new Date(date)
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")
        .split(".")[0];
}

// 🔥 Helper robusto de paginação
async function fetchComPaginacao({ endpoint, companyToken, alteradoApos }) {
    const mercosApi = createMercosApi(companyToken);

    let todosRegistros = [];
    let continuar = true;
    let ultimaData = alteradoApos;
    let loopProtecao = 0;

    while (continuar) {
        loopProtecao++;

        if (loopProtecao > 50) {
            logger.error(
                `[MERCOS] Loop de paginação excedeu 50 iterações | endpoint=${endpoint}`
            );
            break;
        }

        try {
            const params = {};

            if (ultimaData) {
                params.alterado_apos = formatMercosDate(ultimaData);
            }

            logger.info(
                `[MERCOS] GET ${endpoint} | alterado_apos=${params.alterado_apos || "N/A"}`
            );

            const response = await mercosApi.get(endpoint, {
                params,
                timeout: 20000
            });

            const { data, headers } = response;

            if (Array.isArray(data) && data.length > 0) {
                todosRegistros.push(...data);

                const ultimaAlteracao =
                    data[data.length - 1]?.ultima_alteracao;

                if (!ultimaAlteracao) {
                    logger.warn(
                        `[MERCOS] Registro sem ultima_alteracao | encerrando paginação`
                    );
                    break;
                }

                ultimaData = ultimaAlteracao;
            } else {
                continuar = false;
            }

            const limitou = headers["meuspedidos_limitou_registros"];

            if (limitou == 1) {
                logger.info(
                    `[MERCOS] Paginação detectada | buscando próxima página`
                );
                continuar = true;
            } else {
                continuar = false;
            }

        } catch (err) {
            logger.error(`[MERCOS] Erro ao buscar ${endpoint}`);

            if (err.response) {
                logger.error(`Status: ${err.response.status}`);
                logger.error(
                    `Headers: ${JSON.stringify(err.response.headers, null, 2)}`
                );

                if (typeof err.response.data === "object") {
                    logger.error(
                        `Data (JSON): ${JSON.stringify(err.response.data, null, 2)}`
                    );
                } else {
                    logger.error(`Data (RAW): ${err.response.data}`);
                }
            } else {
                logger.error(`Erro sem response: ${err.message}`);
            }

            break;
        }
    }

    return todosRegistros;
}

export async function getMercosSellerById(id) {
    logger.info(`[MERCOS] Buscando vendedor no Mercos | id=${id}`);

    const tokens = [
        env.MERCOS_COMPANY_TOKEN_RHPE,
        env.MERCOS_COMPANY_TOKEN_ATLANTIS
    ];

    for (let i = 0; i < tokens.length; i++) {

        const empresa = i === 0 ? "RHPE" : "ATLANTIS";
        const mercosApi = createMercosApi(tokens[i]);

        try {

            const { data } = await mercosApi.get(`/usuarios/${id}`);

            logger.info(
                `[MERCOS] Vendedor encontrado na empresa ${empresa} | id=${data?.id} | nome=${data?.nome}`
            );

            return {
                empresa: empresa === "RHPE" ? "filial" : "matriz",
                vendedor: data
            };

        } catch (err) {

            // 🔥 se não encontrou OU token não pertence à empresa → tenta próxima
            if (err.response?.status === 404 || err.response?.status === 401) {

                logger.warn(
                    `[MERCOS] Vendedor não encontrado na empresa ${empresa} | tentando próxima`
                );

                continue;
            }

            if (err.response) {
                logger.error(
                    `[MERCOS] Erro na API Mercos | status=${err.response.status} | id=${id}`,
                    err.response.data
                );
            } else {
                logger.error(
                    `[MERCOS] Erro ao chamar API Mercos | id=${id}`,
                    err
                );
            }

            throw err;
        }
    }

    logger.error(
        `[MERCOS] Vendedor não encontrado em nenhuma empresa | id=${id}`
    );

    throw new Error("Vendedor não encontrado em nenhuma empresa");
}

export async function getTitulosComPaginacao(alteradoApos) {

    let todosTitulos = [];

    // 🔹 busca títulos da MATRIZ (ATLANTIS)
    const titulosAtlantis = await fetchComPaginacao({
        endpoint: "/v1/titulos",
        companyToken: env.MERCOS_COMPANY_TOKEN_ATLANTIS,
        alteradoApos
    });

    const titulosAtlantisComEmpresa = titulosAtlantis.map(titulo => ({
        ...titulo,
        empresa: "ATLANTIS"
    }));

    // 🔹 busca títulos da FILIAL (RHPE)
    const titulosRhpe = await fetchComPaginacao({
        endpoint: "/v1/titulos",
        companyToken: env.MERCOS_COMPANY_TOKEN_RHPE,
        alteradoApos
    });

    const titulosRhpeComEmpresa = titulosRhpe.map(titulo => ({
        ...titulo,
        empresa: "RHPE"
    }));

    todosTitulos = [
        ...titulosAtlantisComEmpresa,
        ...titulosRhpeComEmpresa
    ];

    logger.info(`[MERCOS] ATLANTIS títulos: ${titulosAtlantis.length}`);
    logger.info(`[MERCOS] RHPE títulos: ${titulosRhpe.length}`);
    logger.info(`[MERCOS] Total títulos coletados: ${todosTitulos.length}`);

    return todosTitulos;
}

export async function getPedidosComPaginacao(alteradoApos) {

    let todosPedidos = [];

    // 🔹 busca pedidos da MATRIZ (ATLANTIS)
    const pedidosAtlantis = await fetchComPaginacao({
        endpoint: "/v2/pedidos",
        companyToken: env.MERCOS_COMPANY_TOKEN_ATLANTIS,
        alteradoApos
    });

    const pedidosAtlantisComEmpresa = pedidosAtlantis.map(pedido => ({
        ...pedido,
        empresa: "ATLANTIS"
    }));

    // 🔹 busca pedidos da FILIAL (RHPE)
    const pedidosRhpe = await fetchComPaginacao({
        endpoint: "/v2/pedidos",
        companyToken: env.MERCOS_COMPANY_TOKEN_RHPE,
        alteradoApos
    });

    const pedidosRhpeComEmpresa = pedidosRhpe.map(pedido => ({
        ...pedido,
        empresa: "RHPE"
    }));

    todosPedidos = [
        ...pedidosAtlantisComEmpresa,
        ...pedidosRhpeComEmpresa
    ];

    logger.info(`[MERCOS] ATLANTIS pedidos: ${pedidosAtlantis.length}`);
    logger.info(`[MERCOS] RHPE pedidos: ${pedidosRhpe.length}`);
    logger.info(`[MERCOS] Total pedidos coletados: ${todosPedidos.length}`);

    return todosPedidos;
}


export async function getClienteById(mercosId) {
    const companyToken = env.MERCOS_COMPANY_TOKENS[0]; // ✅ pega apenas o primeiro token válido
    console.log(`[MERCOS] 🔍 getClienteById chamado para ID: ${mercosId}`);
    //console.log(`[MERCOS] 🛡️ Usando CompanyToken: ${companyToken}`);

    const mercosApi = createMercosApi(companyToken);

    const response = await mercosApi.get(`/v1/clientes/${mercosId}`);
    console.log(`[MERCOS] ✅ Cliente ${mercosId} retornou status ${response.status}`);
    console.log(`[MERCOS] 📦 Dados do cliente:`, response.data);

    return response.data;
}

export async function getClientesComPaginacao(companyToken, alteradoApos) {

    // 🔹 fallback: últimos 18 meses
    if (!alteradoApos) {
        const date = new Date();
        date.setMonth(date.getMonth() - 24);
        alteradoApos = date.toISOString();
    }

    logger.info(`[MERCOS] Buscando clientes alterados após: ${alteradoApos}`);
    logger.info(`[MERCOS] Company Token: ${companyToken}`)

    let todosClientes = [];

    const clientes = await fetchComPaginacao({
        endpoint: "/v1/clientes",
        companyToken,
        alteradoApos
    });

    logger.info(
        `[MERCOS] ${clientes.length} clientes coletados para token ${companyToken}`
    );

    clientes.forEach(cliente => {
        todosClientes.push({
            ...cliente,
            empresa: companyToken === env.MERCOS_COMPANY_TOKEN_RHPE
                ? "RHPE"
                : "ATLANTIS"
        });
    });

    logger.info(
        `[MERCOS] Total clientes coletados: ${todosClientes.length}`
    );

    return todosClientes;
}