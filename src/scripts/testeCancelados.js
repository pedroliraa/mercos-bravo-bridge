import { env } from "../config/env.js";
import createMercosApi from "../services/mercosApi.js";
import logger from "../utils/logger.js";

// 🔥 helper de data (igual ao service)
function formatMercosDate(date) {
  if (!date) return null;

  return new Date(date)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];
}

// 🔥 função simples só pra RHPE
async function getPedidosRHPE(alteradoApos) {
  const mercosApi = createMercosApi(env.MERCOS_COMPANY_TOKEN_RHPE);

  let todosPedidos = [];
  let continuar = true;
  let ultimaData = alteradoApos;

  while (continuar) {
    const params = {};

    if (ultimaData) {
      params.alterado_apos = formatMercosDate(ultimaData);
    }

    logger.info(
      `[SCRIPT] Buscando pedidos RHPE | alterado_apos=${params.alterado_apos}`
    );

    const response = await mercosApi.get("/v2/pedidos", {
      params,
      timeout: 20000,
    });

    const { data, headers } = response;

    if (Array.isArray(data) && data.length > 0) {
      todosPedidos.push(...data);

      const ultimaAlteracao = data[data.length - 1]?.ultima_alteracao;

      if (!ultimaAlteracao) break;

      ultimaData = ultimaAlteracao;
    } else {
      continuar = false;
    }

    continuar = headers["meuspedidos_limitou_registros"] == 1;
  }

  return todosPedidos;
}

// ======================================================
// 🚀 EXECUÇÃO
// ======================================================
(async () => {
  try {
    logger.info("🚀 [SCRIPT] Iniciando busca de pedidos cancelados");

    // 🔥 pega últimos X minutos (ajusta se quiser)
    const date = new Date();
    date.setHours(date.getHours() - 24); // últimas 24h

    const pedidos = await getPedidosRHPE(date.toISOString());

    logger.info(`[SCRIPT] Total pedidos encontrados: ${pedidos.length}`);

    // 🔥 FILTRO PRINCIPAL
    const cancelados = pedidos.filter(
      (p) => String(p.status) === "0"
    );

    logger.info(
      `[SCRIPT] Total CANCELADOS (status=0): ${cancelados.length}`
    );

    // 🔥 LOG DETALHADO
    cancelados.forEach((p) => {
      console.log("\n==============================");
      console.log(`ID: ${p.id}`);
      console.log(`Número: ${p.numero}`);
      console.log(`Status: ${p.status}`);
      console.log(`Cliente: ${p.cliente_razao_social}`);
      console.log(`CNPJ: ${p.cliente_cnpj}`);
      console.log(`Total: ${p.total}`);
      console.log(`Última alteração: ${p.ultima_alteracao}`);
    });

    // 🔥 EXTRA: JSON bruto (se quiser inspecionar)
    console.log("\n📦 JSON COMPLETO:");
    console.log(JSON.stringify(cancelados, null, 2));

  } catch (error) {
    logger.error("❌ Erro no script", error);
  }
})();