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

export default function mapPedidoMercosToBravoCotacao(
  pedido,
  seller
) {
  return {
    codigo_filial: getCodigoFilialByRepresentada(pedido.representada_id),
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

    parcelas: "",
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