import { mapPedidoItemMercosToBravo } from "./mapPedidoItemMercosToBravo.js";

export function mapPedidoMercosToBravo(evento, pedido) {
  if (!pedido) return null;

  const itensMercos = Array.isArray(pedido.itens) ? pedido.itens : [];

  const itensMapped = itensMercos
    .map(mapPedidoItemMercosToBravo)
    .filter(Boolean);

  const base = {
    // Identificação
    codigo_filial: null,
    codigo_pedido: String(pedido.id),
    codigo_marca: pedido.representada_id
      ? String(pedido.representada_id)
      : null,
    codigo_cliente: pedido.cliente_id
      ? String(pedido.cliente_id)
      : null,
    codigo_vendedor: pedido.criador_id
      ? String(pedido.criador_id)
      : null,

    // Datas
    data_pedido: pedido.data_emissao || null,
    data_entrega: pedido.endereco_entrega?.data || null,

    // Documento
    numero_documento: pedido.numero
      ? String(pedido.numero)
      : null,
    comprador: pedido.nome_contato || pedido.contato_nome || null,

    // Totais
    qtd_itens: itensMapped.length,
    qtd_itens_recusa: null,
    qtd_itens_faturado:
      evento === "pedido.faturado" ? itensMapped.length : null,

    total_bruto_pedido: Number(pedido.total) || 0,
    valor_total_desconto: null,
    total_pedido: Number(pedido.total) || 0,

    total_faturado:
      evento === "pedido.faturado"
        ? Number(pedido.total) || 0
        : 0,

    saldo_faturar:
      evento === "pedido.faturado"
        ? 0
        : Number(pedido.total) || 0,

    // Pagamento
    prazo: pedido.condicao_pagamento || null,
    parcelas: pedido.condicao_pagamento_id || null,

    // Status
    situacao:
      evento === "pedido.cancelado"
        ? "Cancelado"
        : evento === "pedido.faturado"
        ? "Faturado"
        : "Aberto",

    considerar_venda: evento !== "pedido.cancelado",

    // Observações
    observacoes_pedido: pedido.observacoes || null,

    // Campos livres
    pedido_campo_1: null,
    pedido_campo_2: null,
    pedido_campo_3: null,
    pedido_campo_4: null,
    pedido_campo_5: null,

    // 🔗 Itens já mapeados
    itens: itensMapped,
  };

  return base;
}
