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
    if (!companyToken) {
        logger.warn(`[MERCOS] Token não informado para ${endpoint} — pulando`);
        return [];
    }

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

                const ultimaAlteracao = data[data.length - 1]?.ultima_alteracao;

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

            continuar = limitou == 1;

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

// ✅ FUNÇÃO CORRIGIDA (SUPORTA 4 EMPRESAS)
export async function getMercosSellerById(id) {
    logger.info(`[MERCOS] Buscando vendedor no Mercos | id=${id}`);

    const empresas = [
        { nome: "filial", token: env.MERCOS_COMPANY_TOKEN_RHPE },
        { nome: "matriz", token: env.MERCOS_COMPANY_TOKEN_ATLANTIS },
        { nome: "atomy", token: env.MERCOS_COMPANY_TOKEN_ATOMY },
        { nome: "ankorfit", token: env.MERCOS_COMPANY_TOKEN_ANKORFIT }
    ];

    for (const empresaObj of empresas) {
        const { nome, token } = empresaObj;

        if (!token) {
            logger.warn(`[MERCOS] Token não configurado para ${nome} — pulando`);
            continue;
        }

        const mercosApi = createMercosApi(token);

        try {
            const { data } = await mercosApi.get(`/v1/usuarios/${id}`);

            logger.info(
                `[MERCOS] Vendedor encontrado na empresa ${nome} | id=${data?.id} | nome=${data?.nome}`
            );

            return {
                empresa: nome,
                vendedor: data
            };

        } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 401) {
                logger.warn(
                    `[MERCOS] Não encontrado na ${nome} — tentando próxima`
                );
                continue;
            }

            logger.error(
                `[MERCOS] Erro ao buscar vendedor | empresa=${nome} | id=${id}`,
                err
            );

            throw err;
        }
    }

    logger.error(
        `[MERCOS] Vendedor não encontrado em nenhuma empresa | id=${id}`
    );

    throw new Error("Vendedor não encontrado em nenhuma empresa");
}

// ================= TITULOS =================
export async function getTitulosComPaginacao(alteradoApos) {
    const empresas = [
        { nome: "ATLANTIS", token: env.MERCOS_COMPANY_TOKEN_ATLANTIS },
        { nome: "RHPE", token: env.MERCOS_COMPANY_TOKEN_RHPE },
        { nome: "ATOMY", token: env.MERCOS_COMPANY_TOKEN_ATOMY },
        { nome: "ANKORFIT", token: env.MERCOS_COMPANY_TOKEN_ANKORFIT }
    ];

    let todosTitulos = [];

    for (const empresa of empresas) {
        const titulos = await fetchComPaginacao({
            endpoint: "/v1/titulos",
            companyToken: empresa.token,
            alteradoApos
        });

        logger.info(`[MERCOS] ${empresa.nome} títulos: ${titulos.length}`);

        todosTitulos.push(
            ...titulos.map(t => ({
                ...t,
                empresa: empresa.nome
            }))
        );
    }

    logger.info(`[MERCOS] Total títulos: ${todosTitulos.length}`);

    return todosTitulos;
}

// ================= PEDIDOS =================
export async function getPedidosComPaginacao(alteradoApos) {
    const empresas = [
        { nome: "ATLANTIS", token: env.MERCOS_COMPANY_TOKEN_ATLANTIS },
        { nome: "RHPE", token: env.MERCOS_COMPANY_TOKEN_RHPE },
        { nome: "ATOMY", token: env.MERCOS_COMPANY_TOKEN_ATOMY },
        { nome: "ANKORFIT", token: env.MERCOS_COMPANY_TOKEN_ANKORFIT }
    ];

    let todosPedidos = [];

    for (const empresa of empresas) {
        const pedidos = await fetchComPaginacao({
            endpoint: "/v2/pedidos",
            companyToken: empresa.token,
            alteradoApos
        });

        logger.info(`[MERCOS] ${empresa.nome} pedidos: ${pedidos.length}`);

        todosPedidos.push(
            ...pedidos.map(p => ({
                ...p,
                empresa: empresa.nome
            }))
        );
    }

    logger.info(`[MERCOS] Total pedidos: ${todosPedidos.length}`);

    return todosPedidos;
}

// ================= CLIENTES =================
export async function getClientesComPaginacao(companyToken, alteradoApos) {
    if (!alteradoApos) {
        const date = new Date();
        date.setMonth(date.getMonth() - 24);
        alteradoApos = date.toISOString();
    }

    let empresaNome = "UNKNOWN";

    if (companyToken === env.MERCOS_COMPANY_TOKEN_RHPE) {
        empresaNome = "RHPE";
    } else if (companyToken === env.MERCOS_COMPANY_TOKEN_ATLANTIS) {
        empresaNome = "ATLANTIS";
    } else if (companyToken === env.MERCOS_COMPANY_TOKEN_ATOMY) {
        empresaNome = "ATOMY";
    } else if (companyToken === env.MERCOS_COMPANY_TOKEN_ANKORFIT) {
        empresaNome = "ANKORFIT";
    }

    const clientes = await fetchComPaginacao({
        endpoint: "/v1/clientes",
        companyToken,
        alteradoApos
    });

    logger.info(
        `[MERCOS] ${clientes.length} clientes coletados (${empresaNome})`
    );

    return clientes.map(cliente => ({
        ...cliente,
        empresa: empresaNome
    }));
}
