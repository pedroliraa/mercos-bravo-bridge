import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import createMercosApi from "../services/mercosApi.js";

import { handlePedidoWebhook } from "../controllers/pedidos.controller.js";

// ======================================================
// CONFIG
// ======================================================

const DATA_INICIO = "2026-02-01T00:00:00.000Z";
const DATA_FIM    = "2026-04-24T23:59:59.999Z";

const TOKENS = {
  ATLANTIS: env.MERCOS_COMPANY_TOKEN_ATLANTIS,
  RHPE: env.MERCOS_COMPANY_TOKEN_RHPE,
  ATOMY: env.MERCOS_COMPANY_TOKEN_ATOMY,
  ANKORFIT: env.MERCOS_COMPANY_TOKEN_ANKORFIT
};

// ======================================================
// HELPERS
// ======================================================

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatMercosDate(date) {
  return new Date(date)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];
}

function detectarEvento(pedido) {
  if (String(pedido.status) === "0") return "pedido.cancelado";

  if (String(pedido.status) === "2") {
    if (String(pedido.status_faturamento) === "2") {
      return "pedido.faturado";
    }

    return "pedido.gerado";
  }

  return "pedido.gerado";
}

// ======================================================
// FETCH
// ======================================================

async function buscarPedidosEmpresa(nome, token) {
  const mercosApi = createMercosApi(token);

  let todos = [];
  let continuar = true;
  let ultimaData = DATA_INICIO;

  while (continuar) {
    try {
      const { data, headers } = await mercosApi.get("/v2/pedidos", {
        params: {
          alterado_apos: formatMercosDate(ultimaData)
        },
        timeout: 20000
      });

      if (!Array.isArray(data) || !data.length) break;

      const filtrados = data.filter(p => {
        const d = new Date(p.ultima_alteracao);
        return d >= new Date(DATA_INICIO) && d <= new Date(DATA_FIM);
      });

      todos.push(...filtrados.map(p => ({
        ...p,
        empresa: nome
      })));

      ultimaData = data[data.length - 1]?.ultima_alteracao;

      continuar =
        headers["meuspedidos_limitou_registros"] == 1;

    } catch (err) {
      logger.error(`Erro ${nome}`, err.message);
      break;
    }
  }

  return todos;
}

// ======================================================
// EXECUÇÃO
// ======================================================

(async () => {
  try {
    logger.info("🚀 Iniciando reprocessamento de pedidos");

    let todosPedidos = [];

    for (const [empresa, token] of Object.entries(TOKENS)) {
      if (!token) continue;

      logger.info(`🏢 Buscando ${empresa}`);

      const pedidos = await buscarPedidosEmpresa(
        empresa,
        token
      );

      logger.info(`✅ ${empresa}: ${pedidos.length}`);

      todosPedidos.push(...pedidos);
    }

    // ordem cronológica
    todosPedidos.sort(
      (a, b) =>
        new Date(a.ultima_alteracao) -
        new Date(b.ultima_alteracao)
    );

    logger.info(`📦 Total geral: ${todosPedidos.length}`);

    let i = 0;

    for (const pedido of todosPedidos) {
      i++;

      const evento = detectarEvento(pedido);

      logger.info(
        `➡️ ${i}/${todosPedidos.length} | ${pedido.empresa} | ${pedido.id} | ${evento}`
      );

      const fakeReq = {
        body: {
          evento,
          dados: pedido
        }
      };

      const fakeRes = {
        status: () => ({
          json: () => {}
        }),
        json: () => {}
      };

      try {
        await handlePedidoWebhook(fakeReq, fakeRes);
      } catch (err) {
        logger.error(
          `Erro pedido ${pedido.id}`,
          err.message
        );
      }

      await sleep(150);
    }

    logger.info("🎉 Finalizado");

  } catch (err) {
    logger.error("Erro geral", err);
  }
})();