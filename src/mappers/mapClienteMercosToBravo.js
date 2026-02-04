// ======================================================
// CONSTANTES DE REPRESENTADA (INFERIDAS)
// ======================================================
const REPRESENTADA_MATRIZ = 376068;
const REPRESENTADA_FILIAL = 382701;

// ======================================================
// VENDEDORES DA MATRIZ
// ======================================================
const VENDEDORES_MATRIZ = {
  "614297": "118",
  "635050": "18",
  "635052": "33",
  "635055": "49",
  "635056": "51",
  "635057": "56",
  "635060": "61",
  "635065": "74",
  "635067": "82",
  "635080": "127",
  "635114": "116",
  "636808": "46",
  "637387": "16",
  "643921": "28",
  "657650": "133",
  "679718": "142",
  "686638": "30",
  "695303": "3",
  "697081": "153",
  "703818": "101",
  "705118": "79",
  "712374": "155",
  "717565": "149",
  "721669": "68",
  "723571": "140",
  "725092": "102",
  "731205": "58",
  "734847": "150",
  "734848": "83",
  "734849": "106",
  "734850": "131",
  "734851": "87",
  "734852": "88",
};

// ======================================================
// VENDEDORES DA FILIAL
// ======================================================
const VENDEDORES_FILIAL = {
  "627498": "118",
  "635460": "1",
  "635461": "6",
  "635462": "11",
  "635463": "17",
  "635464": "19",
  "635466": "18",
  "635467": "33",
  "635468": "37",
  "635469": "40",
  "635470": "49",
  "635472": "51",
  "635473": "56",
  "635474": "58",
  "635475": "60",
  "635477": "61",
  "635479": "66",
  "635481": "70",
  "635482": "73",
  "635483": "74",
  "635484": "76",
  "635485": "82",
  "635486": "84",
  "635487": "90",
  "635488": "98",
  "635489": "107",
  "635490": "110",
  "635491": "111",
  "635492": "112",
  "635494": "117",
  "635495": "121",
  "635496": "122",
  "635497": "123",
  "635498": "124",
  "635499": "127",
  "635500": "129",
  "635501": "130",
  "635502": "135",
  "635503": "152",
  "635504": "154",
  "635505": "116",
  "636809": "46",
  "637389": "10",
  "637390": "151",
  "637391": "16",
  "643926": "28",
  "661897": "133",
  "679717": "142",
  "685385": "3",
  "686635": "30",
  "697079": "153",
  "712375": "155",
  "717265": "149",
};

// ======================================================
// IDENTIFICA SE É MATRIZ OU FILIAL PELO CRIADOR_ID
// ======================================================
function identificarRepresentadaPorVendedor(criadorId) {
  const idStr = String(criadorId);

  if (VENDEDORES_MATRIZ[idStr]) {
    return REPRESENTADA_MATRIZ;
  }

  if (VENDEDORES_FILIAL[idStr]) {
    return REPRESENTADA_FILIAL;
  }

  return REPRESENTADA_MATRIZ; // fallback seguro
}

// ======================================================
// CÓDIGO DO VENDEDOR (CRM)
// ======================================================
export function getCodigoVendedorCRM(criadorId) {
  if (criadorId == null) return "1";

  const idStr = String(criadorId);

  if (VENDEDORES_MATRIZ[idStr]) {
    return VENDEDORES_MATRIZ[idStr];
  }

  if (VENDEDORES_FILIAL[idStr]) {
    return VENDEDORES_FILIAL[idStr];
  }

  return "1";
}

// ======================================================
// CÓDIGO DA FILIAL (BRAVO)
// ======================================================
function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case REPRESENTADA_MATRIZ:
      return "1";
    case REPRESENTADA_FILIAL:
      return "2";
    default:
      return "1";
  }
}

// ======================================================
// CONTATOS
// ======================================================
function mapContatosMercos(contatos = [], codigoCliente) {
  if (!Array.isArray(contatos)) return [];

  return contatos
    .filter((c) => !c.excluido)
    .map((contato) => ({
      codigo_cliente: String(codigoCliente),
      codigo_contato: String(contato.id),
      nome: contato.nome || null,
      cargo: contato.cargo || null,
      email: contato.emails?.[0]?.email ?? null,
      telefone: contato.telefones?.[0]?.numero ?? null,
      excluido: !!contato.excluido,
    }));
}

// ======================================================
// MAPPER PRINCIPAL
// ======================================================
export default function mapClienteMercosToBravo(input) {
  if (!input || typeof input !== "object") return {};

  // 🔥 NORMALIZAÇÃO
  const cliente = input.dados ?? input;

  const representadaInferida = identificarRepresentadaPorVendedor(
    cliente.criador_id
  );

  const codigoVendedor = getCodigoVendedorCRM(cliente.criador_id);

  const toDateOnly = (v) =>
    v ? String(v).split(" ")[0].split("T")[0] : null;

  return {
    codigo_cliente: String(cliente.id),
    cnpj: cliente.cnpj || null,
    razao_social: cliente.razao_social || cliente.nome || null,
    nome_fantasia: cliente.nome_fantasia || cliente.nome || null,
    ie: cliente.inscricao_estadual || null,
    suframa: cliente.suframa || null,

    logradouro: cliente.rua || null,
    numero: cliente.numero || null,
    complemento: cliente.complemento || null,
    cep: cliente.cep || null,
    bairro: cliente.bairro || null,
    cidade: cliente.cidade || null,
    estado: cliente.estado || null,
    uf: cliente.estado || null,

    data_cadastro:
      toDateOnly(cliente.data_criacao) ||
      toDateOnly(cliente.ultima_alteracao),

    email_principal: cliente.emails?.[0]?.email ?? null,
    telefone_principal: cliente.telefones?.[0]?.numero ?? null,

    codigo_vendedor: codigoVendedor,
    codigo_filial: getCodigoFilialByRepresentada(representadaInferida),

    bloqueado: !!cliente.bloqueado,
    excluido: !!cliente.excluido,
    descricao: cliente.observacao || null,

    contatos: mapContatosMercos(cliente.contatos, cliente.id),
  };
}
