/**
 * Mapeia um contato do Mercos para o formato do Bravo CRM
 * Retorna um array de objetos (um por tipo de contato: email, telefone, celular)
 * @param {Object} contatoMercos
 * @param {Object} clienteMercos
 * @returns {Array<Object>}
 */
export default function mapContatoMercosToBravo(contatoMercos, clienteMercos) {
  const codigo_cliente = clienteMercos.id?.toString() ?? null;
  const codigo_contato_base = contatoMercos.id?.toString() ?? null;
  const nome = contatoMercos.nome ?? null;
  const cargo = contatoMercos.cargo ?? null;

  const contatosBravo = [];

  // Para email
  if (contatoMercos.email) {
    contatosBravo.push({
      codigo_contato: codigo_contato_base + '_email',  // Único por tipo
      codigo_cliente,
      tipo_contato: "e-mail",
      nome,
      contato: contatoMercos.email,
      cargo,
      contato_campo_1: null,
      contato_campo_2: null,
      contato_campo_3: null,
      contato_campo_4: null,
      contato_campo_5: null,
    });
  }

  // Para telefone
  if (contatoMercos.telefone) {
    contatosBravo.push({
      codigo_contato: codigo_contato_base + '_tel',
      codigo_cliente,
      tipo_contato: "telefone",
      nome,
      contato: contatoMercos.telefone,
      cargo,
      contato_campo_1: null,
      contato_campo_2: null,
      contato_campo_3: null,
      contato_campo_4: null,
      contato_campo_5: null,
    });
  }

  // Para celular (trata como telefone)
  if (contatoMercos.celular) {
    contatosBravo.push({
      codigo_contato: codigo_contato_base + '_cel',
      codigo_cliente,
      tipo_contato: "telefone",
      nome,
      contato: contatoMercos.celular,
      cargo,
      contato_campo_1: null,
      contato_campo_2: null,
      contato_campo_3: null,
      contato_campo_4: null,
      contato_campo_5: null,
    });
  }

  return contatosBravo;
}