export default function mapPedidoMercosToBravo(evento, pedido) {
  if (!pedido) return null;

  return {
    codigo_filial: "1",
    codigo_pedido: String(pedido.id),
    codigo_marca: "1",
    codigo_cliente: pedido.cliente_id ? String(pedido.cliente_id) : null,
    codigo_vendedor: pedido.criador_id ? String(pedido.criador_id) : "1",

    data_pedido:
      pedido.data_emissao ||
      pedido.data_criacao?.split(" ")[0] ||
      null,

    data_entrega: null,

    numero_documento: pedido.numero ? String(pedido.numero) : "",
    comprador: pedido.nome_contato || pedido.contato_nome || "",

    qtd_itens: Array.isArray(pedido.itens) ? pedido.itens.length : 0,
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
      evento === "pedido.faturado" ? Number(pedido.total) || 0 : "",
    saldo_faturar:
      evento === "pedido.faturado" ? "" : Number(pedido.total) || 0,

    prazo: pedido.condicao_pagamento || "",
    parcelas: "",

    situacao:
      evento === "pedido.faturado"
        ? "Faturado"
        : "Aberto",

    // ⚠️ SEMPRE STRING
    considerar_venda: "S",

    observacoes_pedido: pedido.observacoes || "",

    pedido_campo_1: "",
    pedido_campo_2: "",
    pedido_campo_3: "",
    pedido_campo_4: "",
    pedido_campo_5: "",
  };
}
