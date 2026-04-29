// src/services/easydata.service.js

import axios from 'axios';
import logger from '../utils/logger.js';
import { env } from "../config/env.js";

const EASYDATA_BASE_URL = 'https://api.easydata.info/easydata';

const credentials = {
    atlanti: {
        workspace: 'grupo_force_atlanticordas',
        usuario: 'grupo_force',
        senha: 'grupo_force@456a',
        'x-api-key': env.API_EASY_TOKEN
    },
    rhpe: {
        workspace: 'grupo_force_rhpe_filial',
        usuario: 'grupo_force',
        senha: 'grupo_force@456a',
        'x-api-key': env.API_EASY_TOKEN
    }
};

function getEasyDataConfig(representadaId) {
    const empresa = representadaId === 376068 ? 'atlanti' : 'rhpe';
    const { workspace, usuario, senha } = credentials[empresa];

    return {
        baseURL: `${EASYDATA_BASE_URL}/${workspace}`,
        auth: { username: usuario, password: senha },
        headers: {
            'x-api-key': credentials[empresa]['x-api-key'],
            'Content-Type': 'application/json'
        }
    };
}

// Função 1: consultarPrevendaParaFaturamento
export async function consultarPrevendaParaFaturamento(representadaId, pedidoIdMercos) {
    try {
        const config = getEasyDataConfig(representadaId);
        const chaveMercos = `MERCOS_${pedidoIdMercos}`;

        const payload = {
            select: ["pk", "fk_faturamento", "chave"],  // Removi "numero" e "data_emissao" pra evitar erro de coluna inexistente
            where: {
                chave: {
                    values: [chaveMercos],
                    operator: "=",
                    logic: "AND"
                }
            },
            where_logic: "AND",
            order_by: [
                { column: "pk", direction: "desc" }  // pk existe sempre (é a PK da tabela)
            ],
            limit: 1,
            offset: 0
        };

        const response = await axios.post('/read/prevenda', payload, config);
        const result = response.data.result || [];

        if (result.length > 0) {
            const fkFaturamento = result[0].fk_faturamento;
            logger.info(`✅ Prevenda encontrada para CHAVE=${chaveMercos} → FK_FATURAMENTO=${fkFaturamento}`);
            return fkFaturamento;
        } else {
            logger.warn(`⚠️ Nenhuma Prevenda encontrada para CHAVE=${chaveMercos}`);
            return null;
        }
    } catch (err) {
        logger.error(`🔥 Erro ao consultar Prevenda (pedido ${pedidoIdMercos}): ${err.message}`);
        if (err.response?.data) logger.error(JSON.stringify(err.response.data, null, 2));
        throw err;
    }
}

// Função 2: consultarFaturamento
export async function consultarFaturamento(representadaId, fkFaturamento) {
    if (!fkFaturamento) return null;
    try {
        const config = getEasyDataConfig(representadaId);
        const payload = {
            select: [
                "pk", "data_emissao", "numero_nfe", "serie_nfe", "chnfe", "vnf", "vprod", "vfrete", "vseg", "vdesc",
                "voutro", "vipi", "vicms", "vbc", "vicmsdeson", "fk_cliente", "tipo_frete", "fk_transportadora",
                "volumes_quantidade", "volumes_especie", "volumes_peso_bruto", "volumes_peso_liquido", "obs"
            ],
            where: {
                pk: {
                    values: [fkFaturamento],
                    operator: "=",
                    logic: "AND"
                }
            },
            where_logic: "AND",
            order_by: [
                { column: "pk", direction: "desc" }  // ← pk existe
            ],
            limit: 1,
            offset: 0
        };

        const response = await axios.post('/read/faturamento', payload, config);
        const result = response.data.result || [];

        if (result.length > 0) {
            logger.info(`✅ Faturamento encontrado para PK=${fkFaturamento}`);
            return result[0];
        } else {
            logger.warn(`⚠️ Faturamento não encontrado para PK=${fkFaturamento}`);
            return null;
        }
    } catch (err) {
        logger.error(`🔥 Erro ao consultar Faturamento (PK ${fkFaturamento}): ${err.message}`);
        throw err;
    }
}

// Função 3: consultarFaturamentoItens
export async function consultarFaturamentoItens(representadaId, fkFaturamento) {
    if (!fkFaturamento) return [];
    try {
        const config = getEasyDataConfig(representadaId);
        const payload = {
            select: [
                "pk", "fk_faturamento", "fk_produto", "quantidade", "preco", "cst", "cfop", "aliq_icms", "vicms",
                "aliq_ipi", "vipi", "infadprod", "nlote", "num_pedido"
            ],
            where: {
                fk_faturamento: {
                    values: [fkFaturamento],
                    operator: "=",
                    logic: "AND"
                }
            },
            where_logic: "AND",
            order_by: [
                { column: "pk", direction: "asc" }  // ← pk existe
            ],
            limit: 200,
            offset: 0
        };

        const response = await axios.post('/read/faturamento_itens', payload, config);
        const result = response.data.result || [];

        logger.info(`✅ ${result.length} itens encontrados para fk_faturamento=${fkFaturamento}`);
        return result;
    } catch (err) {
        logger.error(`🔥 Erro ao consultar itens (fk ${fkFaturamento}): ${err.message}`);
        throw err;
    }
}

// Função para consultar Produtos por ID, retornando a descrição e o grupo
export async function consultarProdutosPorIds(representadaId, produtosIds) {
    if (!produtosIds || produtosIds.length === 0) return [];

    try {
        const config = getEasyDataConfig(representadaId);

        const payload = {
            select: ["pk", "descricao", "grupo", "descricao_nf"],
            where: {
                pk: {
                    values: produtosIds,
                    operator: "in",
                    logic: "AND"
                }
            },
            where_logic: "AND",
            limit: produtosIds.length,
            offset: 0
        };

        const response = await axios.post('/read/produtos', payload, config);
        return response.data.result || [];

    } catch (err) {
        logger.error(`🔥 Erro ao consultar produtos: ${err.message}`);
        throw err;
    }
}