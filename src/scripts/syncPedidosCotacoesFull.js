import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import createMercosApi from "../services/mercosApi.js";

import {
  sendPedidoToBravo,
  sendCotacoesToBravo
} from "../services/bravo.service.js";

import mapPedidoMercosToBravo from "../mappers/mapPedidoMercosToBravo.js";
import mapPedidoMercosToBravoCotacao from "../mappers/mapPedidoMercosToBravoCotacao.js";

import { resolveSellerByMercosId } from "../services/sellerResolver.js";

// ======================================================
// 🔥 CONFIG
// ======================================================

// 🔥 DEFINE AQUI DE ONDE COMEÇA
const DATA_INICIO = "2026-02-01T00:00:00.000Z";

// ======================================================
// 🔥 HELPERS
// ======================================================

function formatMercosDate(date) {
  return new Date(date)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];
}

function resolverSituacao(pedido) {
  if (String(pedido.status) === "0") return "CANCELADO";
  if (String(pedido.status) === "3") return "FATURADO";
  if (String(pedido.status) === "2") return "GERADO";
  if (String(pedido.status) === "1") return "ORCAMENTO";
  return "ORCAMENTO";
}

// ======================================================
// 🔥 FETCH COM PAGINAÇÃO + PROTEÇÕES
// ======================================================

async function fetchPedidosEmpresa(nome, token, alteradoApos) {
  const mercosApi = createMercosApi(token);

  let todos = [];
  let continuar = true;
  let ultimaData = alteradoApos;
  let loop = 0;

  const dataLimite = new Date(alteradoApos);

  while (continuar) {
    loop++;

    if (loop > 50) {
      logger.warn(`⚠️ Loop interrompido (${nome})`);
      break;
    }

    try {
      const params = {
        alterado_apos: formatMercosDate(ultimaData)
      };

      logger.info(
        `[${nome}] Buscando | alterado_apos=${params.alterado_apos}`
      );

      const { data, headers } = await mercosApi.get("/v2/pedidos", {
        params,
        timeout: 10000
      });

      if (!Array.isArray(data) || data.length === 0) break;

      // 🔥 FILTRO REAL (resolve bug da API)
      const filtrados = data.filter(p => {
        const d = new Date(p.ultima_alteracao);
        return d >= dataLimite;
      });

      todos.push(
        ...filtrados.map(p => ({
          ...p,
          empresa: nome
        }))
      );

      const ultimaAlteracao = data[data.length - 1]?.ultima_alteracao;

      if (!ultimaAlteracao) break;

      // 🔥 PROTEÇÃO: NÃO VOLTAR NO TEMPO
      if (new Date(ultimaAlteracao) < new Date(ultimaData)) {
        logger.warn(`⚠️ Data voltou no tempo (${nome}) — encerrando`);
        break;
      }

      ultimaData = ultimaAlteracao;

      continuar = headers["meuspedidos_limitou_registros"] == 1;

    } catch (err) {
      logger.error(`❌ Erro ao buscar ${nome}`, err.message);
      break;
    }
  }

  logger.info(`✅ ${nome}: ${todos.length} pedidos válidos`);
  return todos;
}

// ======================================================
// 🔥 PROCESSAMENTO INDIVIDUAL
// ======================================================

async function processPedido(pedido, index, total) {
  try {
    const situacao = resolverSituacao(pedido);

    logger.info(
      `➡️ [${pedido.empresa}] ${index}/${total} | Pedido ${pedido.id} | ${pedido.ultima_alteracao} | ${situacao}`
    );

    const seller = pedido?.criador_id
      ? await resolveSellerByMercosId(pedido.criador_id)
      : null;

    const codigoVendedor = seller?.bravoSellerCode || "1";

    // ================= COTAÇÃO =================
    const cotacao = mapPedidoMercosToBravoCotacao(
      pedido,
      codigoVendedor
    );

    cotacao.situacao = situacao;

    await sendCotacoesToBravo([cotacao]);

    // ================= PEDIDO =================
    const pedidoMap = await mapPedidoMercosToBravo(
      "sync",
      pedido
    );

    if (pedidoMap) {
      await sendPedidoToBravo(pedidoMap);
    }

  } catch (err) {
    logger.error(
      `❌ Erro pedido ${pedido.id} (${pedido.empresa})`,
      err.message
    );
  }
}

// ======================================================
// 🚀 EXECUÇÃO PRINCIPAL
// ======================================================

(async () => {
  try {
    logger.info("🚀 INICIANDO BACKFILL ORDENADO");

    const empresas = [
      { nome: "ATLANTIS", token: env.MERCOS_COMPANY_TOKEN_ATLANTIS },
      { nome: "RHPE", token: env.MERCOS_COMPANY_TOKEN_RHPE },
      { nome: "ATOMY", token: env.MERCOS_COMPANY_TOKEN_ATOMY },
      { nome: "ANKORFIT", token: env.MERCOS_COMPANY_TOKEN_ANKORFIT }
    ];

    for (const emp of empresas) {
      if (!emp.token) continue;

      logger.info(`\n==============================`);
      logger.info(`🏢 PROCESSANDO: ${emp.nome}`);
      logger.info(`==============================\n`);

      const pedidos = await fetchPedidosEmpresa(
        emp.nome,
        emp.token,
        DATA_INICIO
      );

      if (!pedidos.length) {
        logger.info(`⚠️ ${emp.nome} sem pedidos`);
        continue;
      }

      // 🔥 ORDENAÇÃO POR DATA (CRÍTICO)
      pedidos.sort((a, b) => {
        return new Date(a.ultima_alteracao) - new Date(b.ultima_alteracao);
      });

      logger.info(
        `📊 ${emp.nome} | Início: ${pedidos[0]?.ultima_alteracao} | Fim: ${pedidos[pedidos.length - 1]?.ultima_alteracao}`
      );

      let count = 0;

      for (const pedido of pedidos) {
        count++;
        await processPedido(pedido, count, pedidos.length);
      }

      logger.info(`✅ ${emp.nome} FINALIZADA\n`);
    }

    logger.info("🎉 BACKFILL FINALIZADO");

  } catch (err) {
    logger.error("🔥 ERRO GERAL", err);
  }
})();