import { 
  getTitulosComPaginacao,
  //getClienteById // 👈 ADICIONADO
} from "../services/mercos.service.js";

import { sendFaturasToBravo } from "../services/bravo.service.js";
import mapTituloMercosToBravo from "../mappers/mapTituloMercosToBravo.js";
import IntegrationEvent from "../models/integrationEvent.model.js";
import { processIntegrationEvent } from "../processors/integration.processor.js";
import logger from "../utils/logger.js";

import { getCnpjByMercosClienteId } from "../services/clienteMongo.service.js";

function getDateMinutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

export async function handleWebhookTitulos(req, res) {
  try {
    logger.info("🧾 [TITULOS] Cron iniciado");

    const alteradoApos = getDateMinutesAgo(190);
    //const alteradoApos = "2026-01-01T00:00:00.000Z"; // <-- para testes, pega tudo

    console.log("Data:", new Date().toISOString());

    console.log(`[TITULOS] Buscando títulos alterados após: ${alteradoApos}`);

    const titulos = await getTitulosComPaginacao(alteradoApos);

    logger.info(`🧾 [TITULOS] ${titulos.length} títulos encontrados para sincronização`);
    logger.info(`[TITULOS] Payload dos títulos:\n${JSON.stringify(titulos, null, 2)}`);

    if (!titulos.length) {
      logger.info("[TITULOS] Nenhum título encontrado");
      return res.json({ message: "Nenhum título encontrado" });
    }

    // 🔥 Remove excluídos
    const titulosValidos = titulos.filter(t => !t.excluido);

    if (!titulosValidos.length) {
      logger.info("[TITULOS] Nenhum título válido encontrado");
      return res.json({ message: "Nenhum título válido encontrado" });
    }

    const results = [];

    for (const titulo of titulosValidos) {

      const integrationEvent = await IntegrationEvent.create({
        source: "mercos",
        entityType: "titulo",
        entityId: titulo.id.toString(),
        eventType: "titulo.sincronizado",
        payload: titulo,
        status: "PENDING",
      });

      await processIntegrationEvent({
        eventId: integrationEvent._id,
        execute: async () => {

          logger.info(
            `🧾 [TITULOS] Processando título ID: ${titulo.id}`
          );

          // 🔥 NOVO TRECHO — BUSCA CNPJ DO CLIENTE
          let cnpj = "";

          if (titulo.cliente_id) {
            const cliente = await getCnpjByMercosClienteId(titulo.cliente_id);

            cnpj = cliente.toString().replace(/\D/g, ""); // Remove caracteres não numéricos

            console.log(`[TITULOS] 🔹 Cliente: ${cliente}`);

            //console.log(`[TITULOS] 🔹 Cliente encontrado para ID ${titulo.cliente_id}: ${cliente?.cnpj}`);

            //cnpj = cliente?.cnpj?.replace(/\D/g, "") || "";

            //console.log(`[TITULOS] 📝 CNPJ processado: ${cnpj}`);
          }

          // 🔥 PASSANDO CNPJ PARA O MAPPER
          const tituloMapeado =
            mapTituloMercosToBravo(titulo, cnpj);

            logger.info(
              `🧾 [TITULOS] Título ${titulo.id} mapeado: ${JSON.stringify(tituloMapeado, null, 2)}`
            );

          await sendFaturasToBravo([tituloMapeado]);

          results.push({
            titulo: titulo.id,
            status: "enviado",
          });
        },
      });
    }

    logger.info(
      `🧾 [TITULOS] ${results.length} títulos enviados ao Bravo`
    );

    return res.status(200).json({
      ok: true,
      enviados: results.length,
      results,
    });

  } catch (error) {
    logger.error("🔥 Erro ao sincronizar títulos", error);
    return res.status(500).json({
      ok: false,
      error: "Erro ao sincronizar títulos",
    });
  }
}