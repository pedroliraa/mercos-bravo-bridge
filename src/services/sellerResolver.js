import IntegrationSeller from "../models/integrationSeller.model.js";
import { getMercosSellerById } from "./mercos.service.js";
import { upsertBravoSeller } from "./bravoApi.js";
import logger from "../utils/logger.js";

/**
 * Resolve (ou cria) um vendedor a partir do ID do Mercos
 * - Cache no Mongo
 * - Criação idempotente no Bravo
 */
export async function resolveSellerByMercosId(mercosSellerId) {
  const mercosId = Number(mercosSellerId);

  logger.info(`🔍 [SELLER] Iniciando resolução do vendedor Mercos ID=${mercosId}`);

  // 1️⃣ BUSCA PELO ID NAS DUAS EMPRESAS
  let seller = await IntegrationSeller.findOne({
    $or: [
      { "mercos.matriz": mercosId },
      { "mercos.filial": mercosId },
      { "mercos.atomy": mercosId },
      { "mercos.ankorfit": mercosId }
    ]
  });

  if (seller) {
    logger.info(
      `✅ [SELLER] Vendedor encontrado no cache | idMongo=${seller._id}`
    );
    return seller;
  }

  logger.info(`❌ [SELLER] Cache miss — buscando vendedor no Mercos`);

  // 2️⃣ BUSCA NO MERCOS
  const result = await getMercosSellerById(mercosId);

  if (!result) {
    throw new Error(`Vendedor Mercos ${mercosId} não encontrado`);
  }

  const { empresa, vendedor } = result;

  logger.info(
    `📡 [SELLER] Encontrado no Mercos | empresa=${empresa} | nome=${vendedor.nome}`
  );

  // 3️⃣ BUSCA POR EMAIL (IDENTIDADE GLOBAL)
  seller = await IntegrationSeller.findOne({
    email: vendedor.email
  });

  if (!seller) {
    logger.info(`🆕 [SELLER] Criando novo vendedor no Mongo`);

    const bravoSellerCode = `BRAVO_${vendedor.id}`;

    logger.info(
      `🆕 [SELLER] Gerando bravoSellerCode inicial baseado no primeiro ID recebido: ${bravoSellerCode}`
    );

    seller = await IntegrationSeller.create({
      name: vendedor.nome,
      email: vendedor.email,
      bravoSellerCode,
      mercos: {
        [empresa]: vendedor.id
      }
    });

  } else {
    logger.info(`🔄 [SELLER] Vendedor já existe por email — atualizando vínculo Mercos`);

    seller.mercos[empresa] = vendedor.id;

    // 🔥 ATUALIZA NOME SE MUDOU
    if (seller.name !== vendedor.nome) {
      logger.info(`✏️ [SELLER] Atualizando nome de ${seller.name} → ${vendedor.nome}`);
      seller.name = vendedor.nome;
    }

    await seller.save();

    logger.info(
      `🔄 [SELLER] Vínculo ${empresa} atualizado com ID ${vendedor.id}`
    );
  }

  const bravoPayload = {
    codigo_vendedor: seller.bravoSellerCode,
    nome: seller.name,
    email: seller.email,
    codigo_gestor: "",
    nome_gestor: "",
    email_gestor: ""
  };

  logger.info("🧪 [SELLER] Payload enviado para Bravo:");
  logger.info(JSON.stringify(bravoPayload, null, 2));

  await upsertBravoSeller(bravoPayload);

  logger.info(`🎉 [SELLER] Processo concluído | idMongo=${seller._id}`);

  return seller;
}