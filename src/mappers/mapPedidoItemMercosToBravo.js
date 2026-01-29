/**
 * Mapeia um item de pedido do Mercos para o formato do Bravo (vw_bravo_pedido_item)
 * @param {Object} itemMercos
 * @param {Object} pedidoMercos - necessário para codigo_pedido e representada_id
 * @returns {Object|null}
 */
function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1";
    case 382701:
      return "2";
    default:
      return "1"; // fallback seguro
  }
}

export function mapPedidoItemMercosToBravo(itemMercos = {}, pedidoMercos = {}) {
  if (!itemMercos || typeof itemMercos !== "object") {
    return null;
  }

  const {
    id,
    produto_codigo,
    produto_nome,
    quantidade = 0,
    preco_liquido = 0,
    subtotal = 0,
    observacoes = "",
    ipi = 0,
    st = 0,
    descontos_do_vendedor = [],
    descontos_de_politicas = [],
    descontos_de_promocoes = [],
    quantidade_grades = [],
  } = itemMercos;

  const { id: pedidoId, representada_id } = pedidoMercos; // ← desestrutura aqui

  // === CÁLCULO DO PERCENTUAL DE DESCONTO (obrigatório!) ===
  const totalDescontoVendedor = descontos_do_vendedor.reduce((acc, d) => acc + Number(d || 0), 0);
  const totalDescontoPoliticas = descontos_de_politicas.reduce((acc, d) => acc + Number(d?.desconto || 0), 0);
  const totalDescontoPromocoes = descontos_de_promocoes.reduce((acc, d) => acc + Number(d?.desconto || 0), 0);
  const percentual_desconto = totalDescontoVendedor + totalDescontoPoliticas + totalDescontoPromocoes;
  // ========================================================

  const itemBravo = {
    codigo_filial: getCodigoFilialByRepresentada(representada_id), // ← corrigido aqui
    codigo_pedido: String(pedidoId || ""),
    codigo_marca: "1",
    item: String(id || "").padStart(4, "0"),

    codigo_produto: produto_codigo || "",
    grupo_produto: "GRUPO 1",  // ← FIXO, conforme exemplo da documentação do Bravo
    descricao_produto: produto_nome || "",

    quantidade: String(Number(quantidade).toFixed(2)).replace(/\.00$/, ""),
    valor_unitario: String(Number(preco_liquido).toFixed(2)),
    valor_total: String(Number(subtotal).toFixed(2)),

    percentual_desconto: String(percentual_desconto),

    data_entrega: "",

    base_calculo_icms: "",
    valor_icms: "",
    aliquota_icms: "",
    valor_ipi: String(Number(ipi).toFixed(2)),
    aliquota_ipi: "",
    base_calculo_icms_st: "",
    valor_icms_st: String(Number(st).toFixed(2)),
    ncm: "",
    sequencia_entrega: "",
    unidade_medida: "",

    pedido_item_campo_1: "",
    pedido_item_campo_2: "",
    pedido_item_campo_3: "",
    pedido_item_campo_4: "",
    pedido_item_campo_5: "",

    observacoes_pedido_item: observacoes || "",
  };

  // Só adiciona grades se houver grades reais
  if (Array.isArray(quantidade_grades) && quantidade_grades.length > 0) {
    itemBravo.grades = quantidade_grades.map((g) => ({
      cor: g?.cor || "",
      tamanho: g?.tamanho || "",
      quantidade: String(Number(g?.quantidade || 0).toFixed(2)),
    }));
  }

  return itemBravo;
}