import axios from "axios";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";
import retry from "../utils/retry.js";

/**
 * Axios base – Bravo CRM
 */
const bravoApi = axios.create({
  baseURL: env.BRAVO_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.BRAVO_TOKEN}`,
  },
});

/**
 * Wrapper padrão com retry
 */
async function postToBravo(endpoint, payload) {
  return retry(async () => {
    logger?.info?.(`🚀 POST Bravo → ${endpoint}`);
    return bravoApi.post(endpoint, payload);
  });
}

async function deleteFromBravo(endpoint) {
  return retry(async () => {
    logger?.info?.(`🗑️ DELETE Bravo → ${endpoint}`);
    return bravoApi.delete(endpoint);
  });
}

/* ======================================================
   CLIENTES
====================================================== */

export async function sendClienteToBravo(cliente) {
  if (!cliente) return null;

  const { data } = await postToBravo(
    "/api/v1/vw_bravo_cliente",
    [cliente]
  );

  logger?.info?.(`✅ Cliente enviado: ${cliente.codigo_cliente}`);
  return data;
}

/* ======================================================
   CONTATOS
====================================================== */

export async function sendContatosToBravo(contatos = []) {
  if (!contatos.length) return null;

  const { data } = await postToBravo(
    "/api/v1/vw_bravo_contato",
    contatos
  );

  logger?.info?.(`✅ Contatos enviados: ${contatos.length}`);
  return data;
}

/* ======================================================
   PEDIDOS
====================================================== */

export async function sendPedidoToBravo(pedido) {
  if (!pedido) return null;

  const { data } = await postToBravo(
    "/api/v1/vw_bravo_pedido",
    [pedido]
  );

  logger?.info?.(`✅ Pedido enviado: ${pedido.codigo_pedido}`);
  return data;
}

/* ======================================================
   ITENS DO PEDIDO
====================================================== */

export async function sendPedidoItensToBravo(itens = []) {
  if (!itens.length) return null;

  const { data } = await postToBravo(
    "/api/v1/vw_bravo_pedido_item",
    itens
  );

  logger?.info?.(`✅ Itens de pedido enviados: ${itens.length}`);
  return data;
}

/* ======================================================
   NOTAS FISCAIS
====================================================== */

export async function sendNotaToBravo(nota) {
  if (!nota) return null;

  const { data } = await postToBravo(
    "/api/v1/vw_bravo_nota",
    [nota]
  );

  logger?.info?.(`✅ Nota enviada: ${nota.codigo_nota}`);
  return data;
}

/**
 * DELETE de Nota Fiscal
 */
export async function deleteNotaFromBravo({
  codigo_filial,
  codigo_nota,
  codigo_marca,
}) {
  if (!codigo_filial || !codigo_nota || !codigo_marca) {
    logger?.warn?.("⚠️ Dados insuficientes para DELETE de nota");
    return null;
  }

  const endpoint = `/api/v1/vw_bravo_nota/codigo_filial/${codigo_filial}/codigo_nota/${codigo_nota}/codigo_marca/${codigo_marca}`;

  const { data } = await deleteFromBravo(endpoint);

  logger?.info?.(`🗑️ Nota removida: ${codigo_nota}`);
  return data;
}
