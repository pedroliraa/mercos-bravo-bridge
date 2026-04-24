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
const DELAY_MS = 200;

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
// 🔥 TOKENS POR EMPRESA
// ======================================================

const TOKENS = {
  ATLANTIS: env.MERCOS_COMPANY_TOKEN_ATLANTIS,
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

      if (new Date(ultimaAlteracao) < new Date(ultimaData)) break;

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
// 🔥 SELLER RESOLVER INTELIGENTE
// ======================================================

async function resolverSellerInteligente(pedido) {
  let codigoVendedor = "1";

  if (!pedido?.criador_id) return codigoVendedor;

  // 1️⃣ Mongo
  try {
    const sellerMongo = await resolveSellerByMercosId(pedido.criador_id);

    if (sellerMongo?.bravoSellerCode) {
      return sellerMongo.bravoSellerCode;
    }

    throw new Error("Sem código no Mongo");

  } catch (errMongo) {
    logger.warn(
      `⚠️ Seller não encontrado no Mongo | pedido=${pedido.id} | tentando Mercos`
    );
  }

  // 2️⃣ Mercos API
  try {
    const token = TOKENS[pedido.empresa];
    const mercosApi = createMercosApi(token);

    const { data } = await mercosApi.get(
      `/v1/usuarios/${pedido.criador_id}`
    );

    if (data?.id) {
      logger.info(
        `✅ Seller encontrado no Mercos | id=${data.id} | nome=${data.nome}`
      );
      return "1"; // ou mapear futuramente
    }

  } catch (errMercos) {
    logger.warn(
      `❌ Seller não encontrado nem no Mongo nem no Mercos | pedido=${pedido.id}`
    );
  }

  return codigoVendedor;
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

    await sendCotacoesToBravo([cotacao]);

    // ================= PEDIDO =================
    const pedidoMap = await mapPedidoMercosToBravo("sync", pedido);

    if (pedidoMap) {
      await sendPedidoToBravo(pedidoMap);
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
    logger.info("🚀 INICIANDO BACKFILL");

    const empresas = [
      "ATLANTIS",
      "RHPE",
      "ATOMY",
      "ANKORFIT"
    ];

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

      // 🔥 ORDENAÇÃO POR DATA
      pedidos.sort(
        (a, b) =>
          new Date(a.ultima_alteracao) -
          new Date(b.ultima_alteracao)
      );

      logger.info(
        `📊 ${nome} | ${pedidos[0]?.ultima_alteracao} → ${pedidos[pedidos.length - 1]?.ultima_alteracao}`
      );

      let count = 0;

      for (const pedido of pedidos) {
        count++;
        await processPedido(pedido, count, pedidos.length);
      }

      logger.info(`✅ ${nome} FINALIZADA\n`);
    }

    logger.info("🎉 BACKFILL FINALIZADO");

  } catch (err) {
    logger.error("🔥 ERRO GERAL", err);
  }
})();