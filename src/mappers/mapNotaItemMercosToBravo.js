function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1";
    case 382701:
      return "2";
    default:
      return "1";
  }
}

export function mapNotaItemMercosToBravo(itemEasy, pedido) {
  if (!itemEasy) return null;

  const qtd = Number(itemEasy.quantidade || 0);
  const preco = Number(itemEasy.preco || 0);
  const valorTotal = qtd * preco;

  return {
    codigo_filial: getCodigoFilialByRepresentada(pedido.representada_id),
    codigo_nota: String(pedido.id || itemEasy.fk_faturamento || ""),
    codigo_marca: "1",
    item: String(itemEasy.pk || "1").padStart(5, "0"), // Bravo espera 5 dígitos muitas vezes

    codigo_produto: String(itemEasy.fk_produto || ""),
    grupo_produto: "GRUPO 1",
    descricao_produto: itemEasy.produto || "Produto " + (itemEasy.fk_produto || "sem código"),

    ncm: itemEasy.ncm || "00000000",
    cst: itemEasy.cst || "00",
    cfop: itemEasy.cfop || "6101",
    unidade_medida: itemEasy.unidade || "UN",

    quantidade: String(qtd.toFixed(2)),
    valor_unitario: String(preco.toFixed(2)),
    valor_total: String(valorTotal.toFixed(2)),

    aliquota_icms: String(Number(itemEasy.aliq_icms || 0).toFixed(2)),
    valor_icms: String(Number(itemEasy.vicms || 0).toFixed(2)),

    aliquota_ipi: String(Number(itemEasy.aliq_ipi || 0).toFixed(2)),
    valor_ipi: String(Number(itemEasy.vipi || 0).toFixed(2)),

    lote: itemEasy.nlote || "",
    observacoes_nota_item: itemEasy.infadprod || "",

    nota_item_campo_1: "",
    nota_item_campo_2: "",
    nota_item_campo_3: "",
    nota_item_campo_4: "",
    nota_item_campo_5: ""
  };
}