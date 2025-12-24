import axios from "axios";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";
import retry from "../utils/retry.js";

/* ======================================================
VALIDACÃO DE ENV (FAIL FAST)
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
Wrapper padrão com retry
====================================================== */
async function postToBravo(endpoint, payload) {
  return retry(async () => {
    logger.info(`🚀 [BRAVO] POST ${endpoint}`);
    logger.info(`   [BRAVO] Payload:\n${JSON.stringify(payload, null, 2)}`);
    const response = await bravoApi.post(endpoint, payload);
    logger.info(` ⬅️ [BRAVO] Status ${response.status} ${endpoint}`);
    logger.info(`   [BRAVO] Response:\n${JSON.stringify(response.data, null, 2)}`);

    if (
      response.data?.success === false ||
      response.data?.ok === false ||
      response.data?.errors?.length
    ) {
      throw new Error(`Erro lógico Bravo: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  });
}

async function deleteFromBravo(endpoint) {
  return retry(async () => {
    logger?.info(`🗑️ [BRAVO] DELETE → ${endpoint}`);
    const response = await bravoApi.delete(endpoint);
    logger?.info(`⬅️ [BRAVO] DELETE Status ${response.status}`);
    return response.data;
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

// FUNÇÃO CORRIGIDA: Deleta contatos baseados nos IDs do Mercos (ex: 501, 502)
export async function deleteAllContatosFromBravo(codigo_cliente, idsContatosMercos = []) {
  if (!codigo_cliente) return null;

  const suffixes = ["_email", "_tel", "_cel"];

  // Se tivermos os ids do payload atual, usamos eles para limpar versões antigas
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

/* ======================================================
ITENS DO PEDIDO
====================================================== */
export async function sendPedidoItensToBravo(itens = []) {
  if (!itens.length) return null;
  const data = await postToBravo("/api/v1/vw_bravo_pedido_item", itens);
  logger?.info(`✅ Itens de pedido enviados: ${itens.length}`);
  return data;
}

/* ======================================================
NOTAS FISCAIS
====================================================== */
export async function sendNotaToBravo(nota) {
  if (!nota) return null;
  const data = await postToBravo("/api/v1/vw_bravo_nota", [nota]);
  logger?.info(`✅ Nota enviada: ${nota.codigo_nota}`);
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