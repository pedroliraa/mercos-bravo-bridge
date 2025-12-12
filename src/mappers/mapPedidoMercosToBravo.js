// src/mappers/mapPedidoMercosToBravo.js

export function mapPedidoMercosToBravo(evento, pedido) {
  if (!pedido) return null;

  // Mapeamento base de pedido
  const base = {
    codigo_filial: null,
    codigo_pedido: String(pedido.id),
    codigo_marca: pedido.representada_id ? String(pedido.representada_id) : null,
    codigo_cliente: pedido.cliente_id ? String(pedido.cliente_id) : null,
    codigo_vendedor: pedido.criador_id ? String(pedido.criador_id) : null,

    data_pedido: pedido.data_emissao || null,
    considerar_venda: true,

    numero_documento: pedido.numero ? String(pedido.numero) : null,
    comprador: pedido.nome_contato || pedido.contato_nome || null,

    qtd_itens: pedido.itens ? pedido.itens.length : 0,
    qtd_itens_recusa: null,
    qtd_itens_faturado: null,

    total_bruto_pedido: Number(pedido.total) || 0,
    valor_total_desconto: null,
    total_pedido: Number(pedido.total) || 0,

    prazo: pedido.condicao_pagamento || null,
    parcelas: pedido.condicao_pagamento_id || null,

    situacao:
      evento === "pedido.cancelado"
        ? "Cancelado"
        : evento === "pedido.faturado"
          ? "Faturado"
          : "Aberto",

    data_entrega: pedido.endereco_entrega?.data || null,

    total_faturado: evento === "pedido.faturado" ? Number(pedido.total) : 0,
    saldo_faturar:
      evento === "pedido.faturado" ? 0 : Number(pedido.total) || 0,

    pedido_campo_1: null,
    pedido_campo_2: null,
    pedido_campo_3: null,
    pedido_campo_4: null,
    pedido_campo_5: null,

    observacoes_pedido: pedido.observacoes || null,
  };

  return base;
}

// ----------------------
// MAPEAMENTO DE ITENS
// ----------------------
export function mapPedidoItensMercosToBravo(itens = []) {
  return itens.map((item) => ({
    codigo_filial: null,
    codigo_pedido: String(item.pedido_id || item.id),
    codigo_marca: null,

    item: item.id ? Number(item.id) : null,

    codigo_produto: item.produto_codigo || String(item.produto_id),
    grupo_produto: null,

    unidade_medida: "UN",
    quantidade: Number(item.quantidade) || 0,

    descricao_produto: item.produto_nome || null,
    valor_unitario: Number(item.preco_liquido) || 0,
    valor_total: Number(item.subtotal) || 0,

    percentual_desconto:
      item.descontos_do_vendedor?.[0] ||
      item.descontos_de_politicas?.[0]?.desconto ||
      0,

    data_entrega: null,
    base_calculo_icms: null,
    valor_icms: null,
    aliquota_icms: null,
    valor_ipi: Number(item.ipi) || 0,
    aliquota_ipi: null,
    base_calculo_icms_st: null,
    valor_icms_st: Number(item.st) || 0,
    ncm: null,

    sequencia_entrega: null,
    pedido_item_campo_1: null,
    pedido_item_campo_2: null,
    pedido_item_campo_3: null,
    pedido_item_campo_4: null,
    pedido_item_campo_5: null,

    observacoes_pedido_item: item.observacoes || null,
  }));
}
