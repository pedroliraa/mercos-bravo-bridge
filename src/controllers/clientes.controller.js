import { mapClienteMercosToBravo } from "../mappers/mapClienteMercosToBravo.js";
import logger from "../utils/logger.js"; // se tiver, senão use console

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

      logger?.info?.("📥 Evento recebido (CLIENTE):", tipo);
      // mapear
      const mapped = mapClienteMercosToBravo(dados);
      logger?.info?.("📤 Mapped cliente:", mapped?.codigo_cliente ?? "(sem codigo)");
      // não enviamos ao Bravo ainda — apenas retornamos o mapped para teste
      results.push({ evento: tipo, mapped });
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Erro controller clientes:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
