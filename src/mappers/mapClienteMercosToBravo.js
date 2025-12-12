// src/mappers/mapClienteMercosToBravo.js
export function mapClienteMercosToBravo(cliente) {
  if (!cliente || typeof cliente !== 'object') return {};

  // helper para pegar email/telefone primário
  const firstEmail = (cliente.emails && cliente.emails[0] && (cliente.emails[0].email || cliente.emails[0])) || null;
  const firstPhone = (cliente.telefones && cliente.telefones[0] && (cliente.telefones[0].numero || cliente.telefones[0])) || null;

  // data de cadastro: preferir data_criacao / ultima_alteracao e normalizar para YYYY-MM-DD
  const toDateOnly = (v) => {
    if (!v) return null;
    // aceita "2024-06-28 01:45:55" ou "2024-06-28T01:45:55"
    const d = String(v).split('T')[0].split(' ')[0];
    return d || null;
  };

  return {
    codigo_cliente: cliente.id != null ? String(cliente.id) : null,
    cnpj: cliente.cnpj || cliente.cliente_cnpj || null,
    razao_social: cliente.razao_social || cliente.nome || null,
    nome_fantasia: cliente.nome_fantasia || cliente.nome || null,
    ie: cliente.inscricao_estadual || cliente.cliente_inscricao_estadual || null,
    suframa: cliente.suframa || cliente.cliente_suframa || null,
    codigo_cliente_matriz: cliente.codigo_cliente_matriz || null,
    grupo_economico: cliente.grupo_economico || null,
    segmento: cliente.segmento || null,
    ramo_atividade: cliente.ramo_atividade || null,
    nivel_relacionamento: cliente.nivel_relacionamento || null,
    site: cliente.site || null,
    instagram: cliente.instagram || null,
    facebook: cliente.facebook || null,
    linkedin: cliente.linkedin || null,
    logradouro: cliente.rua || cliente.logradouro || cliente.endereco || cliente.cliente_rua || null,
    numero: cliente.numero || cliente.cliente_numero || null,
    complemento: cliente.complemento || cliente.cliente_complemento || null,
    cep: cliente.cep || cliente.cliente_cep || null,
    bairro: cliente.bairro || cliente.cliente_bairro || null,
    cidade: cliente.cidade || cliente.cliente_cidade || null,
    estado: cliente.estado || cliente.cliente_estado || null,
    pais: cliente.pais || null,
    ibge: cliente.ibge || null,
    uf: cliente.estado || cliente.cliente_estado || null,
    data_cadastro: toDateOnly(cliente.data_criacao) || toDateOnly(cliente.ultima_alteracao) || null,
    cliente_campo_1: cliente.cliente_campo_1 || null,
    cliente_campo_2: cliente.cliente_campo_2 || null,
    cliente_campo_3: cliente.cliente_campo_3 || null,
    cliente_campo_4: cliente.cliente_campo_4 || null,
    cliente_campo_5: cliente.cliente_campo_5 || null,
    descricao: cliente.observacao || cliente.descricao || null,
    codigo_cnae: cliente.codigo_cnae || null,
    // extras práticos
    email_principal: firstEmail,
    telefone_principal: firstPhone,
    bloqueado: cliente.bloqueado || false,
    excluido: cliente.excluido || false
  };
}
