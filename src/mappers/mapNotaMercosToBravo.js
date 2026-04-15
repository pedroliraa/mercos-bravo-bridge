// src/mappers/mapNotaMercosToBravo.js
import { resolveSellerByMercosId } from "../services/sellerResolver.js";
import logger from "../utils/logger.js";

function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1";
    case 382701:
      return "2";
    case 424288:
      return "3";
    case 424289:
      return "4";
    default:
      return "1";
  }
}

export async function mapNotaMercosToBravo(pedido) {
  if (!pedido) return null;

  logger.info(
    `🧾 [MAPPER_NOTA] Iniciando mapeamento da nota | pedido_id=${pedido.id}`
  );

  // 🔑 RESOLVE VENDEDOR IGUAL AO PEDIDO
  let seller = null;

  if (pedido.criador_id) {
    logger.info(
      `🔑 [MAPPER_NOTA] Resolvendo vendedor | mercos_criador_id=${pedido.criador_id}`
    );

    seller = await resolveSellerByMercosId(pedido.criador_id);

    logger.info(
      `✅ [MAPPER_NOTA] Vendedor resolvido | bravoSellerCode=${seller?.bravoSellerCode}`
    );
  }

  const payload = {
    codigo_filial: getCodigoFilialByRepresentada(pedido.representada_id),

    codigo_nota: String(pedido.id),
    codigo_marca: "1",

    codigo_cliente: pedido.cliente_cnpj
      ? String(pedido.cliente_cnpj)
      : null,

    // ✅ CORRETO
    codigo_vendedor: seller?.bravoSellerCode || "1",

    data_nota: pedido.data_emissao || null,
    data_saida: pedido.data_emissao || null,

    numero_documento: pedido.numero
      ? String(pedido.numero)
      : null,

    considerar_venda: true,
    tipo_nota: "VENDA",
    situacao: "Faturado",

    comprador:
      pedido.nome_contato ||
      pedido.contato_nome ||
      null,

    total_nota: Number(pedido.total) || 0,
    valor_total_nota: Number(pedido.total) || 0,
    valor_total_produtos: Number(pedido.total) || 0,

    valor_frete: Number(pedido.valor_frete) || 0,

    parcelas: pedido.condicao_pagamento_id || null,
    prazo: pedido.condicao_pagamento || null,

    tipo_frete: pedido.transportadora_nome || null,
    transportadora: pedido.transportadora_nome || null,

    informacoes_complementares: pedido.observacoes || null,
    observacoes_nota: pedido.observacoes || null,
  };

  logger.info(
    `📦 [MAPPER_NOTA] Payload gerado | codigo_nota=${payload.codigo_nota} | codigo_vendedor=${payload.codigo_vendedor}`
  );

  return payload;
}