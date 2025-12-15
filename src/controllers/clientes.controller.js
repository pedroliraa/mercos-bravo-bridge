import { mapClienteMercosToBravo } from "../mappers/mapClienteMercosToBravo.js";
import { mapContatoMercosToBravo } from "../mappers/mapContatoMercosToBravo.js";
import {
  sendClienteToBravo,
  sendContatoToBravo,
} from "../services/bravo.service.js";
import logger from "../utils/logger.js";

export const handleClienteWebhook = async (req, res) => {
  try {
    const eventos = req.body;

    if (!Array.isArray(eventos)) {
      logger?.warn?.("Payload cliente não é array");
      return res.status(400).json({ error: "Payload deve ser uma lista" });
    }

    const results = [];

    for (const ev of eventos) {
      const tipo = ev.evento;
      const dados = ev.dados || {};

      logger?.info?.(`📥 Evento recebido (CLIENTE): ${tipo}`);

      // ======================
      // CLIENTE
      // ======================
      const clienteMapped = mapClienteMercosToBravo(dados);

      if (clienteMapped) {
        await sendClienteToBravo(clienteMapped);

        logger?.info?.(
          `✅ Cliente enviado: ${clienteMapped.codigo_cliente}`
        );
      }

      // ======================
      // CONTATOS (se existirem)
      // ======================
      let contatosMapped = [];

      if (Array.isArray(dados.contatos) && dados.contatos.length > 0) {
        contatosMapped = dados.contatos.map((contato) =>
          mapContatoMercosToBravo(contato, dados)
        );

        for (const contato of contatosMapped) {
          await sendContatoToBravo(contato);
        }

        logger?.info?.(
          `✅ ${contatosMapped.length} contato(s) enviado(s)`
        );
      }

      results.push({
        evento: tipo,
        cliente: clienteMapped,
        contatos: contatosMapped,
      });
    }

    return res.status(200).json({
      ok: true,
      results,
    });
  } catch (err) {
    logger?.error?.("Erro controller clientes:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
