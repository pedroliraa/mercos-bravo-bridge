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

const DATA_INICIO = "2026-02-01T00:00:00.000Z";
const DELAY_MS = 400; // aumentei pra aliviar API
const RETRY_MAX = 3;

// RHPE → começar do 294
const START_INDEX_RHPE = 293;

// ======================================================
// 🔥 HELPERS
// ======================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
// 🔥 TOKENS (ATLANTIS REMOVIDO)
// ======================================================

const TOKENS = {
  RHPE: env.MERCOS_COMPANY_TOKEN_RHPE,
  ATOMY: env.MERCOS_COMPANY_TOKEN_ATOMY,
  ANKORFIT: env.MERCOS_COMPANY_TOKEN_ANKORFIT
};

// ======================================================
// 🔥 FETCH
// ======================================================

async function fetchPedidosEmpresa(nome, token, alteradoApos) {
  const mercosApi = createMercosApi(token);

  let todos = [];
  let continuar = true;
  let ultimaData = alteradoApos;

  const dataLimite = new Date(alteradoApos);

  while (continuar) {
    try {
      const params = {
        alterado_apos: formatMercosDate(ultimaData)
      };

      logger.info(`[${nome}] Buscando | ${params.alterado_apos}`);

      const { data, headers } = await mercosApi.get("/v2/pedidos", {
        params,
        timeout: 20000
      });

      if (!Array.isArray(data) || data.length === 0) break;

      const filtrados = data.filter(p => {
        const d = new Date(p.ultima_alteracao);
        return d >= dataLimite;
      });

      todos.push(...filtrados.map(p => ({ ...p, empresa: nome })));

      const ultimaAlteracao = data[data.length - 1]?.ultima_alteracao;
      if (!ultimaAlteracao) break;

      ultimaData = ultimaAlteracao;
      continuar = headers["meuspedidos_limitou_registros"] == 1;

    } catch (err) {
      logger.error(`❌ Erro ao buscar ${nome}`, err.message);
      break;
    }
  }

  logger.info(`✅ ${nome}: ${todos.length} pedidos`);
  return todos;
}

// ======================================================
// 🔥 SELLER (COM FALLBACK SAFE)
// ======================================================

async function resolverSellerInteligente(pedido) {
  try {
    if (!pedido?.criador_id) return "1";

    const sellerMongo = await resolveSellerByMercosId(pedido.criador_id);

    if (sellerMongo?.bravoSellerCode) {
      return sellerMongo.bravoSellerCode;
    }

  } catch (err) {
    logger.warn(`⚠️ Mongo falhou (seller), usando fallback`);
  }

  return "1"; // fallback seguro
}

// ======================================================
// 🔥 RETRY WRAPPER
// ======================================================

async function retry(fn, label) {
  for (let i = 1; i <= RETRY_MAX; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`⚠️ Retry ${i}/${RETRY_MAX} falhou (${label})`);

      if (i === RETRY_MAX) {
        throw err;
      }

      await sleep(1000 * i);
    }
  }
}

// ======================================================
// 🔥 PROCESSAMENTO
// ======================================================

async function processPedido(pedido, index, total) {
  try {
    const situacao = resolverSituacao(pedido);

    logger.info(
      `➡️ [${pedido.empresa}] ${index}/${total} | ${pedido.id} | ${situacao}`
    );

    const codigoVendedor = await resolverSellerInteligente(pedido);

    // ================= COTAÇÃO =================
    const cotacao = mapPedidoMercosToBravoCotacao(
      pedido,
      codigoVendedor
    );

    cotacao.situacao = situacao;

    await retry(
      () => sendCotacoesToBravo([cotacao]),
      "cotacao"
    );

    // ================= PEDIDO =================
    const pedidoMap = await mapPedidoMercosToBravo("sync", pedido);

    if (pedidoMap) {
      await retry(
        () => sendPedidoToBravo(pedidoMap),
        "pedido"
      );
    }

    await sleep(DELAY_MS);

  } catch (err) {
    logger.error(
      `❌ Erro pedido ${pedido.id} (${pedido.empresa})`,
      err.message
    );
  }
}

// ======================================================
// 🚀 EXECUÇÃO
// ======================================================

(async () => {
  try {
    logger.info("🚀 INICIANDO BACKFILL AJUSTADO");

    const empresas = ["RHPE", "ATOMY", "ANKORFIT"];

    for (const nome of empresas) {
      const token = TOKENS[nome];
      if (!token) continue;

      logger.info(`\n🏢 PROCESSANDO: ${nome}\n`);

      const pedidos = await fetchPedidosEmpresa(
        nome,
        token,
        DATA_INICIO
      );

      if (!pedidos.length) continue;

      pedidos.sort(
        (a, b) =>
          new Date(a.ultima_alteracao) -
          new Date(b.ultima_alteracao)
      );

      let pedidosFiltrados = pedidos;

      // 🔥 AJUSTE RHPE → pular até 293
      if (nome === "RHPE") {
        pedidosFiltrados = pedidos.slice(START_INDEX_RHPE);
        logger.warn(
          `⏭️ RHPE pulando primeiros ${START_INDEX_RHPE} pedidos`
        );
      }

      let count = 0;

      for (const pedido of pedidosFiltrados) {
        count++;
        await processPedido(pedido, count, pedidosFiltrados.length);
      }

      logger.info(`✅ ${nome} FINALIZADA\n`);
    }

    logger.info("🎉 BACKFILL FINALIZADO");

  } catch (err) {
    logger.error("🔥 ERRO GERAL", err);
  }
})();