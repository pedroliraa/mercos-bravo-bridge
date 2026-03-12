export function mapMercosClienteToMongo(cliente, empresa) {
  return {
    mercosId: cliente.id,
    cnpj: cliente.cnpj?.replace(/\D/g, "") || "",
    razao_social: cliente.razao_social,
    nome_fantasia: cliente.nome_fantasia,
    cidade: cliente.cidade,
    estado: cliente.estado,
    empresa,
    ultima_alteracao: cliente.ultima_alteracao,
    raw: cliente
  };
}