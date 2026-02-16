import logger from "../utils/logger.js";
import { resolveSellerByMercosId } from "../services/sellerResolver.js";

// ======================================================
// FILIAL
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
// MAPPER PRINCIPAL
// ======================================================
export default async function mapClienteMercosToBravo(input, seller) {
  if (!input || typeof input !== "object") {
    logger.warn("[MAPPER_CLIENTE] Input inválido recebido", input);
    return {};
  }

  const cliente = input.dados ?? input;

  logger.info(
    `🧩 [MAPPER_CLIENTE] Iniciando mapeamento do cliente | id=${cliente.id} | criador_id=${cliente.criador_id}`
  );

  //const representadaInferida = identificarRepresentadaPorVendedor(
  //  cliente.criador_id
  //);

  //logger.info(
  //  `🏢 [MAPPER_CLIENTE] Representada inferida: ${representadaInferida}`
  //);

  // 🔑 RESOLVE VENDEDOR (Mongo → Bravo)
  logger.info(
    `🔑 [MAPPER_CLIENTE] Resolvendo vendedor para Mercos ID ${cliente.criador_id}`
  );

  //const seller = await resolveSellerByMercosId(cliente.criador_id);

  logger.info(
    `✅ [MAPPER_CLIENTE] Vendedor resolvido | bravoSellerCode=${seller?.bravoSellerCode}`
  );

  const toDateOnly = (v) =>
    v ? String(v).split(" ")[0].split("T")[0] : null;

  const payload = {
    codigo_cliente: cliente.cnpj || null,
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

    // 🎯 AQUI É O PONTO-CHAVE
    codigo_vendedor: seller.bravoSellerCode,

    codigo_filial: null,

    bloqueado: !!cliente.bloqueado,
    excluido: !!cliente.excluido,
    descricao: cliente.observacao || null,

    contatos: [],
  };

  logger.info(
    `📦 [MAPPER_CLIENTE] Payload Bravo gerado | codigo_cliente=${payload.codigo_cliente} | codigo_vendedor=${payload.codigo_vendedor} | codigo_filial=${payload.codigo_filial}`
  );

  return payload;
}