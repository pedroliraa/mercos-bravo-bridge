// src/mappers/mapNotaMercosToBravo.js

export function mapNotaMercosToBravo(pedido) {
  if (!pedido) return null;

  return {
    // Identificação
    codigo_filial: 1,
    codigo_nota: String(pedido.id), // usamos o ID do pedido como chave da nota
    codigo_marca: 1,

    codigo_cliente: pedido.cliente_id
      ? String(pedido.cliente_id)
      : null,

    codigo_vendedor: pedido.criador_id
      ? String(pedido.criador_id)
      : null,

    // Datas
    data_nota: pedido.data_emissao || null,
    data_saida: pedido.data_emissao || null,
    hora_saida: null,
    data_recebimento: null,

    // Documento
    numero_documento: pedido.numero
      ? String(pedido.numero)
      : null,

    serie: null,
    chave_acesso: null,

    // Comercial
    considerar_venda: true,
    tipo_nota: "VENDA",
    natureza_operacao: null,
    situacao: "Faturado",

    comprador:
      pedido.nome_contato ||
      pedido.contato_nome ||
      null,

    // Valores
    total_nota: Number(pedido.total) || 0,
    valor_total_nota: Number(pedido.total) || 0,
    valor_total_produtos: Number(pedido.total) || 0,

    valor_frete: Number(pedido.valor_frete) || 0,
    valor_seguro: null,
    descontos: null,
    outras_despesas: null,

    valor_ipi: null,
    valor_icms: null,
    base_calculo_icms: null,
    valor_icms_st: null,
    base_calculo_icms_st: null,
    valor_total_tributos: null,

    // Logística
    qtd_volumes: null,
    especie_volumes: null,
    peso_bruto: null,
    peso_liquido: null,

    tipo_frete: pedido.transportadora_nome || null,
    transportadora: pedido.transportadora_nome || null,

    // Financeiro
    parcelas: pedido.condicao_pagamento_id || null,
    prazo: pedido.condicao_pagamento || null,

    // Previsão
    previsao_entrega: null,

    // Campos extras
    nota_campo_1: null,
    nota_campo_2: null,
    nota_campo_3: null,
    nota_campo_4: null,
    nota_campo_5: null,

    informacoes_complementares: pedido.observacoes || null,
    observacoes_nota: pedido.observacoes || null,
  };
}
