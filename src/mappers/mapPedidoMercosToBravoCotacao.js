export default function mapPedidoMercosToBravoCotacao(
  pedido,
  seller
) {
  return {
    codigo_filial: "1",
    codigo_cotacao: String(pedido.id),
    codigo_marca: "1",

    // 🔥 AGORA É CNPJ
    codigo_cliente: pedido.cliente_cnpj || "",

    codigo_vendedor: seller || "",

    data_cotacao: pedido.data_emissao || "",
    numero_documento: pedido.numero
      ? String(pedido.numero)
      : "",

    comprador: pedido.nome_contato || "",

    total_cotacao: pedido.total
      ? String(pedido.total)
      : "0",

    parcelas: pedido.condicao_pagamento || "",
    prazo: pedido.prazo_entrega || "",

    situacao: "ORCAMENTO",

    cotacao_campo_1: "",
    cotacao_campo_2: "",
    cotacao_campo_3: "",
    cotacao_campo_4: "",
    cotacao_campo_5: "",

    observacoes_cotacao: pedido.observacoes || ""
  };
}