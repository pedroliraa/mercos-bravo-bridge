import mapPedidoMercosToBravo from "../mappers/mapPedidoMercosToBravo.js";
import { mapPedidoItemMercosToBravo } from "../mappers/mapPedidoItemMercosToBravo.js";
import { handleNotaFromPedido } from "./notas.controller.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import {
  sendPedidoToBravo,
  sendPedidoItensToBravo,
  sendNotaToBravo,
  sendMarcaToBravo,
  deletePedidoFromBravo,
  deleteNotaFromBravo,
} from "../services/bravo.service.js";
import { parseMercosPayload } from "../services/mercosParser.service.js";
import logger from "../utils/logger.js";
import { resolveSellerByMercosId } from "../services/sellerResolver.js";

// 🔥 IMPORTS NOVOS
import Cliente from "../models/integrationClient.model.js";
import { handleClienteWebhook } from "./clientes.controller.js";
import { enviarCotacaoFromPedido } from "./orcamentos.controller.js";

// ======================================================
// 🔥 GARANTIR CLIENTE
// ======================================================
async function garantirClienteExiste(dadosPedido) {
  const cnpj = dadosPedido?.cliente_cnpj?.toString();

  if (!cnpj) {
    logger.warn("⚠️ [PEDIDOS] Pedido sem CNPJ");
    return null;
  }

  let cliente = await Cliente.findOne({ cnpj });

  if (cliente) {
    logger.info(`✅ [PEDIDOS] Cliente já existe | CNPJ=${cnpj}`);
    return cliente;
  }

  logger.warn(`⚠️ [PEDIDOS] Cliente NÃO encontrado — criando | CNPJ=${cnpj}`);

  const clientePayload = {
    evento: "cliente.cadastrado",
    dados: {
      id: dadosPedido.cliente_id,
      cnpj: cnpj,
      razao_social: dadosPedido.cliente_razao_social,
      nome_fantasia: dadosPedido.cliente_nome_fantasia,
      inscricao_estadual: dadosPedido.cliente_inscricao_estadual,
      cep: dadosPedido.cliente_cep,
      rua: dadosPedido.cliente_rua,
      numero: dadosPedido.cliente_numero,
      complemento: dadosPedido.cliente_complemento,
      bairro: dadosPedido.cliente_bairro,
      cidade: dadosPedido.cliente_cidade,
      estado: dadosPedido.cliente_estado,
      emails: (dadosPedido.cliente_email || []).map(e => ({ email: e })),
      telefones: (dadosPedido.cliente_telefone || []).map(t => ({ numero: t })),
      criador_id: dadosPedido.criador_id,
      data_criacao: dadosPedido.data_criacao,
      ultima_alteracao: dadosPedido.ultima_alteracao
    }
  };

  const fakeReq = { body: clientePayload };
  const fakeRes = { status: () => ({ json: () => {} }) };

  await handleClienteWebhook(fakeReq, fakeRes);

  logger.info(`🎉 [PEDIDOS] Cliente criado via fluxo`);

  return await Cliente.findOne({ cnpj });
}

// ======================================================
// CONTROLLER PRINCIPAL
// ======================================================
export async function handlePedidoWebhook(req, res) {
  try {
    logger.info("🧪 [PEDIDOS] Webhook recebido");
    logger.info(`[PEDIDOS] Payload:\n${JSON.stringify(req.body, null, 2)}`);

    const eventos = parseMercosPayload(req.body, "pedido");
    const results = [];

    for (const item of eventos) {
      const { evento, dados } = item;

      logger.info(`🔥 EVENTO RECEBIDO: ${evento}`);

      const integrationEvent = await IntegrationEvent.create({
        source: "mercos",
        entityType: "pedido",
        entityId: dados?.id?.toString(),
        eventType: evento,
        payload: item,
        status: "PENDING",
      });

      await processIntegrationEvent({
        eventId: integrationEvent._id,
        execute: async () => {
          logger.info(`🧪 [PEDIDOS] Processando: ${evento} | ID: ${dados?.id}`);

          // ================= CANCELAMENTO =================
          if (evento === "pedido.cancelado") {
            logger.info("🛑 [PEDIDOS] Cancelamento detectado");

            const codigoPedido = String(dados.id);

            await deleteNotaFromBravo({
              codigo_filial: "1",
              codigo_nota: codigoPedido,
              codigo_marca: "1",
            });

            await deletePedidoFromBravo({
              codigo_filial: "1",
              codigo_pedido: codigoPedido,
              codigo_marca: "1",
            });

            logger.info("📑 [PEDIDOS → ORCAMENTOS] Enviando CANCELADO");

            try {
              await enviarCotacaoFromPedido(dados, "CANCELADO");
              logger.info("✅ Cotação CANCELADA enviada");
            } catch (err) {
              logger.error("❌ Erro cotação CANCELADA", err);
            }

            results.push({ evento, pedido: "cancelado" });
            return;
          }

          // ================= CLIENTE =================
          await garantirClienteExiste(dados);

          // ================= COTAÇÃO =================
          if (evento === "pedido.gerado") {
            logger.info("📑 Evento GERADO → enviando cotação");

            try {
              await enviarCotacaoFromPedido(dados, "GERADO");
              logger.info("✅ Cotação GERADO enviada");
            } catch (err) {
              logger.error("❌ Erro cotação GERADO", err);
            }
          }

          if (evento === "pedido.faturado") {
            logger.info("📑 Evento FATURADO → enviando cotação");

            try {
              await enviarCotacaoFromPedido(dados, "FATURADO");
              logger.info("✅ Cotação FATURADO enviada");
            } catch (err) {
              logger.error("❌ Erro cotação FATURADO", err);
            }
          }

          // ================= PEDIDO =================
          const pedidoMapeado = await mapPedidoMercosToBravo(evento, dados);

          if (pedidoMapeado) {
            await sendPedidoToBravo(pedidoMapeado);
          }

          // ================= ITENS =================
          const itensMapeados = (dados?.itens || []).map((item) =>
            mapPedidoItemMercosToBravo(item, dados)
          );

          if (itensMapeados.length > 0) {
            await sendPedidoItensToBravo(itensMapeados);
          }

          // ================= VENDEDOR =================
          const seller = dados?.criador_id
            ? await resolveSellerByMercosId(dados.criador_id)
            : null;

          const codigoVendedorCRM = seller?.bravoSellerCode || "1";

          // ================= CLIENTE =================
          const codigoCliente =
            pedidoMapeado?.codigo_cliente ||
            dados.cliente_cnpj?.toString();

          // ================= MARCA =================
          if (codigoCliente) {
            await sendMarcaToBravo({
              codigo_cliente: codigoCliente,
              codigo_marca: "1",
              codigo_vendedor: codigoVendedorCRM,
              codigo_vendedor2: "",
              codigo_gestor: "",
              restricao: "",
              categoria_carteira: "",
              marca_campo_1: "",
              marca_campo_2: "",
              marca_campo_3: "",
              marca_campo_4: "",
              marca_campo_5: "",
            });
          }

          // ================= NOTA =================
          if (evento === "pedido.faturado") {
            const notaMapeada = await handleNotaFromPedido(dados);

            if (notaMapeada) {
              await sendNotaToBravo(notaMapeada);
            }
          }

          results.push({
            evento,
            pedido: "enviado",
            itens: itensMapeados.length,
          });
        },
      });
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    logger.error("🔥 Erro geral no webhook de pedidos", err);
    return res.status(500).json({ ok: false });
  }
}