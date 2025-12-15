/**
 * Mapeia um item de pedido do Mercos para o formato do Bravo
 * @param {Object} itemMercos
 * @returns {Object}
 */
export function mapPedidoItemMercosToBravo(itemMercos = {}) {
  if (!itemMercos || typeof itemMercos !== "object") {
    return null;
  }

  const {
    id,
    produto_id,
    produto_codigo,
    produto_nome,
    quantidade,
    preco_tabela,
    preco_liquido,
    subtotal,
    observacoes,
    ipi,
    st,
    tipo_ipi,
    descontos_do_vendedor = [],
    descontos_de_politicas = [],
    descontos_de_promocoes = [],
    quantidade_grades = [],
  } = itemMercos;

  const totalDescontoVendedor = descontos_do_vendedor.reduce(
    (acc, d) => acc + Number(d || 0),
    0
  );

  const totalDescontoPoliticas = descontos_de_politicas.reduce(
    (acc, d) => acc + Number(d?.desconto || 0),
    0
  );

  const totalDescontoPromocoes = descontos_de_promocoes.reduce(
    (acc, d) => acc + Number(d?.desconto || 0),
    0
  );

  return {
    codigo_item: String(id ?? ""),
    codigo_produto: produto_codigo || String(produto_id ?? ""),
    descricao_produto: produto_nome || null,

    quantidade: Number(quantidade ?? 0),
    preco_tabela: Number(preco_tabela ?? 0),
    preco_liquido: Number(preco_liquido ?? 0),
    subtotal: Number(subtotal ?? 0),

    valor_ipi: Number(ipi ?? 0),
    tipo_ipi: tipo_ipi || null,
    valor_st: Number(st ?? 0),

    desconto_vendedor: totalDescontoVendedor,
    desconto_politicas: totalDescontoPoliticas,
    desconto_promocoes: totalDescontoPromocoes,

    observacoes: observacoes || null,

    // Grades (quando existirem)
    grades: Array.isArray(quantidade_grades) && quantidade_grades.length > 0
      ? quantidade_grades.map((g) => ({
          cor: g?.cor || null,
          tamanho: g?.tamanho || null,
          quantidade: Number(g?.quantidade ?? 0),
        }))
      : null,
  };
}
