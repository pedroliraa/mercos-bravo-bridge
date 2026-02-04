import logger from "../utils/logger.js";

/**
 * Mapeia um contato do Mercos para o formato do Bravo CRM
 * Retorna um array (email(s) + telefone(s))
 */
export default function mapContatoMercosToBravo(contatoMercos, clienteMercos) {
  logger.info("🧪 [MAP_CONTATO] Contato Mercos recebido:");
  logger.info(JSON.stringify(contatoMercos, null, 2));

  // ❌ contato excluído NÃO vai para o Bravo
  if (contatoMercos.excluido === true) {
    logger.warn(`⚠️ [MAP_CONTATO] Contato ${contatoMercos.id} marcado como excluído — ignorado`);
    return [];
  }

  const codigo_cliente = clienteMercos.id?.toString();
  const codigo_base = contatoMercos.id?.toString();
  const nome = contatoMercos.nome ?? null;
  const cargo = contatoMercos.cargo ?? null;

  const contatosBravo = [];

  // ================= EMAILS =================
  if (Array.isArray(contatoMercos.emails)) {
    contatoMercos.emails.forEach((e, index) => {
      if (!e?.email) return;

      contatosBravo.push({
        codigo_contato: `${codigo_base}_email_${index + 1}`,
        codigo_cliente,
        tipo_contato: "e-mail",
        nome,
        contato: e.email,
        cargo,
        contato_campo_1: null,
        contato_campo_2: null,
        contato_campo_3: null,
        contato_campo_4: null,
        contato_campo_5: null,
      });
    });
  }

  // ================= TELEFONES =================
  if (Array.isArray(contatoMercos.telefones)) {
    contatoMercos.telefones.forEach((t, index) => {
      if (!t?.numero) return;

      contatosBravo.push({
        codigo_contato: `${codigo_base}_tel_${index + 1}`,
        codigo_cliente,
        tipo_contato: "telefone",
        nome,
        contato: t.numero,
        cargo,
        contato_campo_1: null,
        contato_campo_2: null,
        contato_campo_3: null,
        contato_campo_4: null,
        contato_campo_5: null,
      });
    });
  }

  logger.info(`🧪 [MAP_CONTATO] Contatos Bravo gerados: ${contatosBravo.length}`);
  logger.info(JSON.stringify(contatosBravo, null, 2));

  return contatosBravo;
}
