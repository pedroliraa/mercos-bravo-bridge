import mapClienteMercosToBravo from "../../mappers/mapClienteMercosToBravo.js";
import mapContatoMercosToBravo from "../../mappers/mapContatoMercosToBravo.js";

import {
  sendClienteToBravo,
  sendContatosToBravo,
  sendMarcaToBravo,
  deleteClienteFromBravo,
  deleteAllContatosFromBravo,
  deleteMarcaFromBravo,
} from "../../services/bravo.service.js";

import logger from "../../utils/logger.js";

/**
 * Handler de eventos de Cliente
 * Usado tanto pelo webhook quanto pelo retry
 */
export async function handleClienteEvent({ eventType, payload }) {
  const dados = payload?.dados || {};

  logger.info(`🔧 [HANDLER CLIENTE] Processando ${eventType} | ID: ${dados.id}`);

  /* ======================================================
     EXCLUSÃO
  ====================================================== */
  if (eventType === "cliente.excluido") {
    const codigo_cliente = dados.id?.toString();

    if (!codigo_cliente) {
      throw new Error("ID do cliente não informado");
    }

    await deleteClienteFromBravo(codigo_cliente);
    await deleteMarcaFromBravo({
      codigo_cliente,
      codigo_marca: "1",
    });

    await deleteAllContatosFromBravo(codigo_cliente, []);

    logger.info(`🗑️ Cliente excluído no Bravo: ${codigo_cliente}`);
    return;
  }

  /* ======================================================
     CLIENTE (CREATE / UPDATE)
  ====================================================== */

  // Remove contatos antes de mapear cliente
  const dadosSemContatos = { ...dados };
  delete dadosSemContatos.contatos;

  const clienteMapped = mapClienteMercosToBravo(dadosSemContatos);

  if (clienteMapped?.codigo_cliente) {
    await sendClienteToBravo(clienteMapped);
    logger.info(`✅ Cliente enviado: ${clienteMapped.codigo_cliente}`);
  }

  /* ======================================================
     MARCA
  ====================================================== */
  const marcaVinculo = {
    codigo_cliente: dados.id.toString(),
    codigo_marca: "1",
    codigo_vendedor: dados.criador_id?.toString() || "1",
  };

  await sendMarcaToBravo(marcaVinculo);
  logger.info(`✅ Marca vinculada: ${dados.id}`);

  /* ======================================================
     CONTATOS
  ====================================================== */
  if (Array.isArray(dados.contatos)) {
    const idsContatos = dados.contatos.map(c => c.id.toString());

    // Limpeza seletiva
    await deleteAllContatosFromBravo(dados.id.toString(), idsContatos);

    const contatosMapped = dados.contatos
      .flatMap(c => mapContatoMercosToBravo(c, dados))
      .filter(Boolean);

    if (contatosMapped.length > 0) {
      await sendContatosToBravo(contatosMapped);
      logger.info(`✅ Contatos enviados: ${contatosMapped.length}`);
    }
  }
}
