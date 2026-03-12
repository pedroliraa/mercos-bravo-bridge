import mongoose from "mongoose";
import { getClientesComPaginacao } from "../services/mercos.service.js";
import { saveOrUpdateClienteMercos } from "../services/clienteMongo.service.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

async function populateClientes() {
  try {

    logger.info("🚀 Iniciando população de clientes no Mongo");

    await mongoose.connect(env.MONGO_URI);

    logger.info("✅ Conectado ao Mongo");

//logger.info(`TOKEN ATLANTIS: ${env.MERCOS_COMPANY_TOKEN_ATLANTIS}`)
//logger.info(`TOKEN RHPE: ${env.MERCOS_COMPANY_TOKEN_RHPE}`)

    // busca todos clientes do mercos
    // 1️⃣ busca clientes da matriz (ATLANTIS)
const clientesAtlantis = await getClientesComPaginacao(
  env.MERCOS_COMPANY_TOKEN_ATLANTIS
);



// 2️⃣ busca clientes da filial (RHPE)
const clientesRhpe = await getClientesComPaginacao(
  env.MERCOS_COMPANY_TOKEN_RHPE
);

logger.info(`📦 ATLANTIS: ${clientesAtlantis.length}`)
logger.info(`📦 RHPE: ${clientesRhpe.length}`)

const clientes = [...clientesAtlantis, ...clientesRhpe];

    logger.info(`📦 ${clientes.length} clientes encontrados no Mercos`);

    let count = 0;

    for (const cliente of clientes) {

      await saveOrUpdateClienteMercos(cliente, cliente.empresa);

      count++;

      if (count % 100 === 0) {
        logger.info(`📊 ${count} clientes processados`);
      }

    }

    logger.info(`🎉 Finalizado! ${count} clientes inseridos/atualizados`);

    process.exit(0);

  } catch (error) {

    logger.error("🔥 Erro ao popular clientes", error);

    process.exit(1);

  }
}

populateClientes();