export default function mapItensParaCotacaoItemBravo(pedido, produtosMap) {

  return pedido.itens.map((item, index) => {
    const produto = produtosMap[item.produto_id];

    const quantidade = String(item.quantidade); // string
    const valorUnitario = item.preco_liquido != null ? String(item.preco_liquido) : "0";
    const valorTotal = item.preco_liquido != null ? String(item.preco_liquido * item.quantidade) : "0";

    return {
      codigo_filial: "1",
      codigo_cotacao: String(pedido.id),
      codigo_marca: "1",
      item: String(index + 1),
      codigo_produto: produto?.codigo || item.produto_codigo || "", // fallback pro código do Mercos
      grupo_produto: "GRUPO 1",
      unidade_medida: produto?.unidade || "", 
      quantidade: quantidade,
      descricao_produto: item.produto_nome || "SEM DESCRIÇÃO", // pega do Mercos
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      cotacao_item_campo_1: "",
      cotacao_item_campo_2: "",
      cotacao_item_campo_3: "",
      cotacao_item_campo_4: "",
      cotacao_item_campo_5: "",
      observacoes_cotacao_item: item.observacoes || ""
    };
  });
}