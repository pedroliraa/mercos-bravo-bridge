export default function mapTituloMercosToBravo(titulo, cnpj) {
  return {
    codigo_filial: "1", // ajustar conforme regra
    codigo_fatura: String(titulo.id),
    codigo_marca: "1",
    codigo_cliente: cnpj
      ? String(cnpj)
      : "",

    nosso_numero: "",
    parcela: titulo.numero_parcela
      ? String(titulo.numero_parcela)
      : "1",

    numero_documento: titulo.numero_documento || "",
    serie: "",

    data_faturamento: titulo.data_pagamento || titulo.data_vencimento ||"",
    data_vencimento: titulo.data_vencimento || "",

    valor_documento: titulo.valor
      ? String(titulo.valor)
      : "0",

    data_pagamento: titulo.data_pagamento || "",

    desconto_abatimento: "",
    mora_multa: "",
    valor_pagamento: "",
    outros_acrescimos: "",

    fatura_campo_1: "",
    fatura_campo_2: "",
    fatura_campo_3: "",
    fatura_campo_4: "",
    fatura_campo_5: "",

    observacoes_fatura: titulo.observacao || ""
  };
}