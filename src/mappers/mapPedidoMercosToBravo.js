import logger from "../utils/logger.js";
import { resolveSellerByMercosId } from "../services/sellerResolver.js";

// ======================================================
// FILIAL
// ======================================================
function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1"; // Matriz
    case 382701:
      return "2"; // Filial
    case 424288:
      return "3"; // Atomy
    case 424289:
      return "4"; // Ankorfit
    default:
      return "1";
  }
}

// ======================================================
// REGRA NOVA: BASEADA NA CONDIÇÃO DE PAGAMENTO
// ======================================================
function getTipoPedidoByCondicao(condicaoPagamento = "") {
  const condicao = condicaoPagamento.toUpperCase();

  if (condicao.includes("BONIFICA")) return "BONIFICACAO";
  if (condicao.includes("CONSIGNA")) return "CONSIGNACAO";
  if (condicao.includes("DEVOLU")) return "DEVOLUCAO";
  if (condicao.includes("MOSTRU")) return "MOSTRUARIO";
  if (condicao.includes("TROCA")) return "TROCA";

  return "VENDA";
}

function isVendaByCondicao(condicaoPagamento) {
  return getTipoPedidoByCondicao(condicaoPagamento) === "VENDA";
}

// ======================================================
// MAPPER PEDIDO
// ======================================================
export default async function mapPedidoMercosToBravo(evento, pedido) {
  if (!pedido) {
    logger.warn("[MAPPER_PEDIDO] Pedido vazio ou inválido recebido");
    return null;
  }

  logger.info(
    `🧾 [MAPPER_PEDIDO] Iniciando mapeamento | id=${pedido.id} | evento=${evento}`
  );

  // 🔑 RESOLVE VENDEDOR
  let seller = null;

  if (pedido.criador_id) {
    logger.info(
      `🔑 [MAPPER_PEDIDO] Resolvendo vendedor | mercos_criador_id=${pedido.criador_id}`
    );

    seller = await resolveSellerByMercosId(pedido.criador_id);

    logger.info(
      `✅ [MAPPER_PEDIDO] Vendedor resolvido | bravoSellerCode=${seller?.bravoSellerCode}`
    );
  } else {
    logger.warn(
      `[MAPPER_PEDIDO] Pedido sem criador_id | pedido_id=${pedido.id}`
    );
  }

  // ✅ NOVA REGRA AQUI
  const condicaoPagamento = pedido.condicao_pagamento || "";
  const tipoPedidoDescricao = condicaoPagamento;

  const considerarVenda = isVendaByCondicao(
    pedido.condicao_pagamento
  );

  const payload = {
    codigo_filial: getCodigoFilialByRepresentada(pedido.representada_id),

    codigo_pedido: String(pedido.id),
    codigo_marca: "1",

    codigo_cliente: pedido.cliente_cnpj
      ? String(pedido.cliente_cnpj)
      : null,

    codigo_vendedor: seller?.bravoSellerCode || "1",

    data_pedido:
      pedido.data_emissao ||
      pedido.data_criacao?.split(" ")[0] ||
      null,

    data_entrega: null,

    numero_documento: pedido.numero
      ? String(pedido.numero)
      : "",

    comprador:
      pedido.nome_contato ||
      pedido.contato_nome ||
      "",

    qtd_itens: Array.isArray(pedido.itens)
      ? pedido.itens.length
      : 0,

    qtd_itens_recusa: "",

    qtd_itens_faturado:
      evento === "pedido.faturado"
        ? Array.isArray(pedido.itens)
          ? pedido.itens.length
          : 0
        : "",

    total_bruto_pedido: Number(pedido.total) || 0,
    valor_total_desconto: "",
    total_pedido: Number(pedido.total) || 0,

    total_faturado:
      evento === "pedido.faturado"
        ? Number(pedido.total) || 0
        : "",

    saldo_faturar:
      evento === "pedido.faturado"
        ? ""
        : Number(pedido.total) || 0,

    prazo: pedido.condicao_pagamento || "",
    parcelas: "",

    situacao:
      evento === "pedido.faturado"
        ? "Faturado"
        : "Aberto",

    // 🔥 REGRA FINAL
    considerar_venda: considerarVenda ? "true" : "false",

    observacoes_pedido: pedido.observacoes || "",

    pedido_campo_1: "",
    pedido_campo_2: "",
    pedido_campo_3: "",
    pedido_campo_4: "",
    pedido_campo_5: "",
  };

  logger.info(
    `📊 [MAPPER_PEDIDO] Condição=${pedido.condicao_pagamento} | tipo=${tipoPedidoDescricao} | considerar_venda=${considerarVenda}`
  );

  return payload;
}