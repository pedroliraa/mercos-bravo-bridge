/**
 * Mapeia um contato do Mercos para o formato do Bravo CRM
 * @param {Object} contatoMercos
 * @param {Object} clienteMercos
 */
export default function mapContatoMercosToBravo(contatoMercos, clienteMercos) {
  return {
    // Identificadores
    codigo_contato: contatoMercos.id?.toString() ?? null,
    codigo_cliente: clienteMercos.id?.toString() ?? null,

    // Dados principais
    nome: contatoMercos.nome ?? null,
    cargo: contatoMercos.cargo ?? null,
    departamento: contatoMercos.departamento ?? null,

    // Comunicação
    email: contatoMercos.email ?? null,
    telefone: contatoMercos.telefone ?? null,
    celular: contatoMercos.celular ?? null,

    // Flags / status
    principal: contatoMercos.principal ?? false,
    ativo: contatoMercos.excluido === true ? false : true,

    // Campos extras (reservado)
    contato_campo_1: null,
    contato_campo_2: null,
    contato_campo_3: null,
    contato_campo_4: null,
    contato_campo_5: null,

    // Observações
    observacoes: contatoMercos.observacao ?? null,
  };
}
