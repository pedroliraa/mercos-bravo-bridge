// src/mappers/mapClienteMercosToBravo.js

function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1"; // Matriz AtlantiCordas
    case 382701:
      return "2"; // Filial RHPE
    default:
      return "1";
  }
}

function getCodigoVendedorCRM(representadaId, criadorId) {
  const idStr = String(criadorId);

  // 🔹 MATRIZ
  if (Number(representadaId) === 376068) {
    if (idStr === "614297") return "118";
    if (idStr === "635050") return "18";
    if (idStr === "635052") return "33";
    if (idStr === "635055") return "49";
    if (idStr === "635056") return "51";
    if (idStr === "635057") return "56";
    if (idStr === "635060") return "61";
    if (idStr === "635065") return "74";
    if (idStr === "635067") return "82";
    if (idStr === "635080") return "127";
    if (idStr === "635114") return "116";
    if (idStr === "636808") return "46";
    if (idStr === "637387") return "16";
    if (idStr === "643921") return "28";
    if (idStr === "657650") return "133";
    if (idStr === "679718") return "142";
    if (idStr === "686638") return "30";
    if (idStr === "695303") return "3";
    if (idStr === "697081") return "153";
    if (idStr === "703818") return "101";
    if (idStr === "705118") return "79";
    if (idStr === "712374") return "155";
    if (idStr === "717565") return "149";
    if (idStr === "721669") return "68";
    if (idStr === "723571") return "140";
    if (idStr === "725092") return "102";
    if (idStr === "731205") return "58";
    if (idStr === "734847") return "150";
    if (idStr === "734848") return "83";
    if (idStr === "734849") return "106";
    if (idStr === "734850") return "131";
    if (idStr === "734851") return "87";
    if (idStr === "734852") return "88";
  }

  // 🔹 FILIAL
  if (Number(representadaId) === 382701) {
    if (idStr === "627498") return "118";
    if (idStr === "635460") return "1";
    if (idStr === "635461") return "6";
    if (idStr === "635462") return "11";
    if (idStr === "635463") return "17";
    if (idStr === "635464") return "19";
    if (idStr === "635466") return "18";
    if (idStr === "635467") return "33";
    if (idStr === "635468") return "37";
    if (idStr === "635469") return "40";
    if (idStr === "635470") return "49";
    if (idStr === "635472") return "51";
    if (idStr === "635473") return "56";
    if (idStr === "635474") return "58";
    if (idStr === "635475") return "60";
    if (idStr === "635477") return "61";
    if (idStr === "635479") return "66";
    if (idStr === "635481") return "70";
    if (idStr === "635482") return "73";
    if (idStr === "635483") return "74";
    if (idStr === "635484") return "76";
    if (idStr === "635485") return "82";
    if (idStr === "635486") return "84";
    if (idStr === "635487") return "90";
    if (idStr === "635488") return "98";
    if (idStr === "635489") return "107";
    if (idStr === "635490") return "110";
    if (idStr === "635491") return "111";
    if (idStr === "635492") return "112";
    if (idStr === "635494") return "117";
    if (idStr === "635495") return "121";
    if (idStr === "635496") return "122";
    if (idStr === "635497") return "123";
    if (idStr === "635498") return "124";
    if (idStr === "635499") return "127";
    if (idStr === "635500") return "129";
    if (idStr === "635501") return "130";
    if (idStr === "635502") return "135";
    if (idStr === "635503") return "152";
    if (idStr === "635504") return "154";
    if (idStr === "635505") return "116";
    if (idStr === "636809") return "46";
    if (idStr === "637389") return "10";
    if (idStr === "637390") return "151";
    if (idStr === "637391") return "16";
    if (idStr === "643926") return "28";
    if (idStr === "661897") return "133";
    if (idStr === "679717") return "142";
    if (idStr === "685385") return "3";
    if (idStr === "686635") return "30";
    if (idStr === "697079") return "153";
    if (idStr === "712375") return "155";
    if (idStr === "717265") return "149";
  }

  return "1"; // fallback seguro
}

export default function mapClienteMercosToBravo(cliente) {
  if (!cliente || typeof cliente !== "object") return {};

  const firstEmail =
    cliente.emails?.[0]?.email || cliente.emails?.[0] || null;

  const firstPhone =
    cliente.telefones?.[0]?.numero || cliente.telefones?.[0] || null;

  const toDateOnly = (v) => {
    if (!v) return null;
    return String(v).split("T")[0].split(" ")[0];
  };

  const codigoVendedor =
    cliente.criador_id && cliente.representada_id
      ? getCodigoVendedorCRM(cliente.representada_id, cliente.criador_id)
      : "1";

  return {
    codigo_cliente: cliente.id != null ? String(cliente.id) : null,
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
      toDateOnly(cliente.ultima_alteracao) ||
      null,

    email_principal: firstEmail,
    telefone_principal: firstPhone,

    // 🔥 NOVOS CAMPOS IMPORTANTES
    codigo_vendedor: codigoVendedor,
    codigo_filial: getCodigoFilialByRepresentada(cliente.representada_id),

    bloqueado: !!cliente.bloqueado,
    excluido: !!cliente.excluido,
    descricao: cliente.observacao || null,
  };
}
