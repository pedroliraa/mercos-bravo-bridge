import mapClienteMercosToBravo from "../mappers/mapClienteMercosToBravo.js";
import mapContatoMercosToBravo from "../mappers/mapContatoMercosToBravo.js";
import {
  sendClienteToBravo,
  sendContatosToBravo,
  sendMarcaToBravo,
  deleteClienteFromBravo,
  deleteAllContatosFromBravo,
  deleteMarcaFromBravo,
} from "../services/bravo.service.js";
import logger from "../utils/logger.js";

export const handleClienteWebhook = async (req, res) => {
  try {
    logger?.info("📥 [CLIENTES] Webhook recebido");
    logger?.info(`[CLIENTES] Payload bruto:\n${JSON.stringify(req.body, null, 2)}`); // ← mudou debug para info

    const eventos = req.body;

    if (!Array.isArray(eventos)) {
      logger?.warn("[CLIENTES] Payload não é um array");
      return res.status(400).json({
        ok: false,
        error: "Payload deve ser uma lista de eventos",
      });
    }

    logger?.info(`[CLIENTES] ${eventos.length} evento(s) recebido(s)`);

    const results = [];

    for (let i = 0; i < eventos.length; i++) {
      const ev = eventos[i];
      const tipo = ev?.evento;
      const dados = ev?.dados || {};

      logger?.info(`🔄 [CLIENTES] Processando evento ${i + 1}/${eventos.length}`);
      logger?.info(`[CLIENTES] Tipo do evento: ${tipo}`);
      logger?.info(`[CLIENTES] Dados do evento:\n${JSON.stringify(dados, null, 2)}`); // ← mudou debug para info

      let clienteMapped = null;
      let contatosMapped = [];

      if (tipo === "cliente.excluido") {
        try {
          const codigo_cliente = dados.id.toString();
          await deleteClienteFromBravo(codigo_cliente);
          await deleteMarcaFromBravo({ codigo_cliente, codigo_marca: "1" });
          await deleteAllContatosFromBravo(codigo_cliente, []);
          logger.info(`✅ Cliente excluído completamente: ${codigo_cliente}`);
        } catch (err) {
          logger.error("❌ Erro ao excluir cliente/contatos/marca", err);
        }
      } else {
        // Gambiarra para cliente aceitar update
        const dadosSemContatos = { ...dados };
        delete dadosSemContatos.contatos;

        try {
          clienteMapped = mapClienteMercosToBravo(dadosSemContatos);
          if (clienteMapped && clienteMapped.codigo_cliente) {
            await sendClienteToBravo(clienteMapped);
            logger.info(`✅ Cliente enviado/atualizado: ${clienteMapped.codigo_cliente}`);
          }
        } catch (err) {
          logger.error("❌ Erro ao enviar cliente", err);
        }

        // Marca
        try {
          const codigo_cliente = dados.id?.toString();
          const codigo_vendedor = dados.criador_id?.toString() || "1";

          const marcaVinculo = {
            codigo_cliente,
            codigo_marca: "1",
            codigo_vendedor,
            codigo_vendedor2: "",
            codigo_gestor: "",
            restricao: "",
            categoria_carteira: "",
            marca_campo_1: "",
            marca_campo_2: "",
            marca_campo_3: "",
            marca_campo_4: "",
            marca_campo_5: "",
          };

          await sendMarcaToBravo(marcaVinculo);
        } catch (err) {
          logger.error("❌ Erro ao enviar marca", err);
        }

        // Contatos
        try {
          const codigo_cliente = dados.id?.toString();

          if (Array.isArray(dados.contatos) && dados.contatos.length > 0) {
            const idsContatos = dados.contatos.map(c => c.id.toString());

            await deleteAllContatosFromBravo(codigo_cliente, idsContatos);

            contatosMapped = dados.contatos
              .flatMap((contato) => mapContatoMercosToBravo(contato, dados))
              .filter(Boolean);

            if (contatosMapped.length > 0) {
              await sendContatosToBravo(contatosMapped);
              logger.info(`✅ Contatos sincronizados: ${contatosMapped.length}`);
            }
          } else {
            await deleteAllContatosFromBravo(codigo_cliente, []);
            logger.info("ℹ️ Nenhum contato no payload — limpeza tentativa executada");
          }
        } catch (err) {
          logger.error("❌ Erro ao sincronizar contatos", err);
        }
      }

      results.push({
        evento: tipo,
        cliente: clienteMapped,
        contatos: contatosMapped,
      });

      logger?.info(`[CLIENTES] Evento "${tipo}" finalizado`);
    }

    logger?.info("[CLIENTES] Processamento finalizado");

    return res.status(200).json({
      ok: true,
      results,
    });
  } catch (err) {
    logger?.error("🔥 [CLIENTES] Erro geral no controller");
    if (err.stack) logger?.error(err.stack);

    return res.status(500).json({
      ok: false,
      error: "Erro interno no processamento de clientes",
    });
  }
};