import axios from "axios";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";
import retry from "../utils/retry.js";

/* ======================================================
VALIDAÇÃO DE ENV (FAIL FAST)
====================================================== */
if (!env.BRAVO_URL) {
  logger?.error?.("❌ BRAVO_URL não definida no ambiente");
  throw new Error("BRAVO_URL não definida");
}
if (!env.BRAVO_TOKEN) {
  logger?.error?.("❌ BRAVO_TOKEN não definido no ambiente");
  throw new Error("BRAVO_TOKEN não definido");
}
const BRAVO_BASE_URL = env.BRAVO_URL.replace(/\/+$/, "");
logger?.info(`🔗 [BRAVO] Base URL configurada: ${BRAVO_BASE_URL}`);

/* ======================================================
Axios base – Bravo CRM
====================================================== */
const bravoApi = axios.create({
  baseURL: BRAVO_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.BRAVO_TOKEN}`,
  },
});

/* ======================================================
Wrapper padrão com retry + LOGS DETALHADOS DE ERROS
====================================================== */
async function postToBravo(endpoint, payload) {
  return retry(async () => {
    logger.info(`🚀 [BRAVO] POST ${endpoint}`);
    logger.info(` [BRAVO] Payload:\n${JSON.stringify(payload, null, 2)}`);
    try {
      const response = await bravoApi.post(endpoint, payload);
      logger.info(`⬅️ [BRAVO] Status ${response.status} ${endpoint}`);
      logger.info(` [BRAVO] Response:\n${JSON.stringify(response.data, null, 2)}`);
      // Verifica erro lógico mesmo com status 2xx
      if (
        response.data?.success === false ||
        response.data?.ok === false ||
        response.data?.errors?.length > 0 ||
        response.data?.erros?.length > 0 ||
        response.data?.mensagem
      ) {
        const erroMsg =
          response.data?.erros ||
          response.data?.errors ||
          response.data?.mensagem ||
          response.data?.message ||
          JSON.stringify(response.data);
        logger.error(`❌ [BRAVO] Erro lógico na resposta (status ${response.status})`);
        logger.error(` Detalhes: ${erroMsg}`);
        if (Array.isArray(response.data?.erros)) {
          logger.error(" 🚨 Lista de erros do Bravo:");
          response.data.erros.forEach((e, i) => logger.error(` ${i + 1}. ${e}`));
        }
        if (Array.isArray(response.data?.errors)) {
          logger.error(" 🚨 Lista de errors (inglês):");
          response.data.errors.forEach((e, i) => logger.error(` ${i + 1}. ${e}`));
        }
        throw new Error(`Bravo retornou erro lógico: ${erroMsg}`);
      }
      return response.data;
    } catch (error) {
      // ============= ERRO HTTP (400, 404, 500 etc.) =============
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data || {};
        logger.error(`❌ [BRAVO] HTTP ${status} em ${endpoint}`);
        logger.error(` [BRAVO] Response Error Body:\n${JSON.stringify(data, null, 2)}`);
        // Destaque especial para os erros de validação do Bravo
        if (Array.isArray(data?.erros) && data.erros.length > 0) {
          logger.error(" 🚨 Erros detalhados do Bravo (erros):");
          data.erros.forEach((e, i) => logger.error(` ${i + 1}. ${e}`));
        }
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
          logger.error(" 🚨 Errors detalhados do Bravo (errors):");
          data.errors.forEach((e, i) => logger.error(` ${i + 1}. ${e}`));
        }
        if (data?.mensagem) {
          logger.error(` 🚨 Mensagem: ${data.mensagem}`);
        }
        if (data?.message) {
          logger.error(` 🚨 Message: ${data.message}`);
        }
        // Relança com contexto claro
        throw new Error(`Bravo HTTP ${status}: ${JSON.stringify(data)}`);
      }
      // ============= SEM RESPOSTA (timeout, rede, etc.) =============
      if (error.request) {
        logger.error(`❌ [BRAVO] Sem resposta do servidor (timeout ou problema de rede) em ${endpoint}`);
        throw new Error("Bravo sem resposta (timeout/rede)");
      }
      // ============= ERRO INESPERADO =============
      logger.error(`❌ [BRAVO] Erro inesperado: ${error.message}`);
      throw error;
    }
  });
}

/* ======================================================
DELETE com tratamento amigável de 404
====================================================== */
async function deleteFromBravo(endpoint) {
  return retry(async () => {
    logger?.info(`🗑️ [BRAVO] DELETE → ${endpoint}`);
    try {
      const response = await bravoApi.delete(endpoint);
      logger?.info(`⬅️ [BRAVO] DELETE Status ${response.status}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        logger?.info(`ℹ️ [BRAVO] DELETE 404 — recurso não existe (pode ser normal)`);
        return null;
      }
      logger?.error(`❌ [BRAVO] Erro no DELETE ${endpoint}: ${error.response?.status || error.message}`);
      throw error;
    }
  });
}

/* ======================================================
CLIENTES
====================================================== */
export async function sendClienteToBravo(cliente) {
  if (!cliente) return null;
  const data = await postToBravo("/api/v1/vw_bravo_cliente", [cliente]);
  logger.info(`✅ Cliente enviado para Bravo: ${cliente.codigo_cliente}`);
  return data;
}
export async function deleteClienteFromBravo(codigo_cliente) {
  if (!codigo_cliente) return null;
  const endpoint = `/api/v1/vw_bravo_cliente/codigo_cliente/${codigo_cliente}`;
  const data = await deleteFromBravo(endpoint);
  logger.info(`🗑️ Cliente removido: ${codigo_cliente}`);
  return data;
}
/* ======================================================
CONTATOS
====================================================== */
export async function sendContatosToBravo(contatos = []) {
  if (!contatos.length) return null;
  const data = await postToBravo("/api/v1/vw_bravo_contato", contatos);
  logger.info(`✅ Contatos enviados: ${contatos.length} contato(s)`);
  return data;
}
export async function deleteContatoFromBravo({ codigo_cliente, codigo_contato }) {
  if (!codigo_cliente || !codigo_contato) return null;
  const endpoint = `/api/v1/vw_bravo_contato/codigo_cliente/${codigo_cliente}/codigo_contato/${codigo_contato}`;
  const data = await deleteFromBravo(endpoint);
  logger.info(`🗑️ Contato removido: ${codigo_contato} do cliente ${codigo_cliente}`);
  return data;
}
/* ======================================================
LIMPEZA DE CONTATOS ANTIGOS (função necessária pro clientes.controller)
====================================================== */
export async function deleteAllContatosFromBravo(codigo_cliente, idsContatosMercos = []) {
  if (!codigo_cliente) return null;

  const suffixes = ["_email", "_tel", "_cel"];
  const idsParaLimpar = idsContatosMercos.length > 0 ? idsContatosMercos : [];

  if (idsParaLimpar.length === 0) {
    logger.info("ℹ️ Nenhum ID de contato fornecido — pulando limpeza seletiva");
    return;
  }

  for (const idMercos of idsParaLimpar) {
    for (const suffix of suffixes) {
      const codigo_contato = `${idMercos}${suffix}`;
      try {
        await deleteContatoFromBravo({ codigo_cliente, codigo_contato });
      } catch (err) {
        logger.info(`Contato ${codigo_contato} não existia ou já deletado`);
      }
    }
  }

  logger.info(`🧹 Limpeza de contatos antigos concluída para cliente ${codigo_cliente}`);
}
/* ======================================================
PEDIDOS
====================================================== */
export async function sendPedidoToBravo(pedido) {
  if (!pedido) return null;
  const data = await postToBravo("/api/v1/vw_bravo_pedido", [pedido]);
  logger?.info(`✅ Pedido enviado: ${pedido.codigo_pedido}`);
  return data;
}
export async function sendPedidoItensToBravo(itens = []) {
  if (!itens.length) return null;
  const data = await postToBravo("/api/v1/vw_bravo_pedido_item", itens);
  logger?.info(`✅ Itens de pedido enviados: ${itens.length}`);
  return data;
}
export async function deletePedidoFromBravo({
  codigo_filial,
  codigo_pedido,
  codigo_marca,
}) {
  if (!codigo_filial || !codigo_pedido || !codigo_marca) {
    logger.warn("⚠️ Dados insuficientes para DELETE de pedido");
    return null;
  }
  const endpoint =
    `/api/v1/vw_bravo_pedido` +
    `/codigo_filial/${codigo_filial}` +
    `/codigo_pedido/${codigo_pedido}` +
    `/codigo_marca/${codigo_marca}`;
  return deleteFromBravo(endpoint);
}
/* ======================================================
NOTAS FISCAIS - CORRIGIDO
====================================================== */
export async function sendNotaToBravo(nota) {
  if (!nota || !nota.codigo_filial || !nota.codigo_nota || !nota.total_nota) {
    logger.error(`[NOTA] Nota inválida ou incompleta – NÃO enviando: ${JSON.stringify(nota)}`);
    return null;
  }

  const data = await postToBravo("/api/v1/vw_bravo_nota", [nota]);
  logger.info(`✅ Nota enviada: ${nota.codigo_nota}`);
  return data;
}

export async function deleteNotaFromBravo({
  codigo_filial,
  codigo_nota,
  codigo_marca,
}) {
  if (!codigo_filial || !codigo_nota || !codigo_marca) {
    logger?.warn("⚠️ Dados insuficientes para DELETE de nota");
    return null;
  }
  const endpoint = `/api/v1/vw_bravo_nota/codigo_filial/${codigo_filial}/codigo_nota/${codigo_nota}/codigo_marca/${codigo_marca}`;
  const data = await deleteFromBravo(endpoint);
  logger?.info(`🗑️ Nota removida: ${codigo_nota}`);
  return data;
}

/* ======================================================
ITENS DE NOTAS FISCAIS - CORRIGIDO
====================================================== */
export async function sendNotaItensToBravo(itens = []) {
  if (!itens.length) {
    logger.warn("⚠️ Nenhum item de nota para enviar ao Bravo");
    return null;
  }

  // Filtra itens inválidos (sem codigo_nota, item ou descricao_produto)
  const itensValidos = itens.filter(item => 
    item && item.codigo_nota && item.item && item.descricao_produto && item.descricao_produto.trim() !== ""
  );

  if (itensValidos.length !== itens.length) {
    logger.warn(`[NOTA_ITEM] ${itens.length - itensValidos.length} itens inválidos descartados`);
  }

  if (!itensValidos.length) {
    logger.error("[NOTA_ITEM] Nenhum item válido após filtro – não enviando");
    return null;
  }

  const data = await postToBravo("/api/v1/vw_bravo_nota_item", itensValidos);
  logger.info(`✅ Itens de nota enviados: ${itensValidos.length}`);
  return data;
}

/* ======================================================
MARCAS
====================================================== */
export async function sendMarcaToBravo(marca) {
  if (!marca) return null;
  const data = await postToBravo("/api/v1/vw_bravo_marca", [marca]);
  logger?.info(`✅ Marca vinculada para CRM: ${marca.codigo_cliente} (marca: ${marca.codigo_marca}, vendedor: ${marca.codigo_vendedor})`);
  return data;
}
export async function deleteMarcaFromBravo({
  codigo_cliente,
  codigo_marca = "1",
}) {
  if (!codigo_cliente) return null;
  const endpoint = `/api/v1/vw_bravo_marca/codigo_cliente/${codigo_cliente}/codigo_marca/${codigo_marca}`;
  const data = await deleteFromBravo(endpoint);
  logger?.info(`🗑️ Marca removida: ${codigo_cliente}`);
  return data;
}

/* ======================================================
FATURAS/TITULOS
====================================================== */
export async function sendFaturasToBravo(faturas) {
  try {
    logger.info(`[BRAVO] Enviando ${faturas.length} faturas`);

    const { data } = await bravoApi.post(
      "/api/v1/vw_bravo_fatura",
      faturas
    );

    logger.info(`[BRAVO] Faturas enviadas com sucesso`);

    return data;
  } catch (error) {
    logger.error(
      "[BRAVO] Erro ao enviar faturas",
      error.response?.data || error.message
    );
    throw error;
  }
}

/* ======================================================
COTAÇÕES/ORÇAMENTOS
====================================================== */
export async function sendCotacoesToBravo(cotacoes) {
  try {
    logger.info(`[BRAVO] Enviando ${cotacoes.length} cotações`);

    const { data } = await bravoApi.post(
      "/api/v1/vw_bravo_cotacao",
      cotacoes
    );

    logger.info(`[BRAVO] Cotações enviadas com sucesso`);

    return data;
  } catch (error) {
    logger.error(
      "[BRAVO] Erro ao enviar cotações",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function sendCotacaoItensToBravo(itens) {

  try {
    const response = await bravoApi.post(
      "/api/v1/vw_bravo_cotacao_item",
      itens
    );

    logger.info("[BRAVO] Cotacao item enviada com sucesso");

    return response.data;

  } catch (err) {
    logger.error("[BRAVO] Erro ao enviar cotacao item");
    throw err;
  }
}