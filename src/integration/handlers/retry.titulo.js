export async function handleRetryTitulo(titulo) {

  logger.info(`🔁 [RETRY TITULO] Reprocessando ${titulo.id}`);

  let cnpj = "";

  if (titulo.cliente_id) {
    const cliente = await getCnpjByMercosClienteId(titulo.cliente_id);
    cnpj = cliente?.toString().replace(/\D/g, "") || "";
  }

  const tituloMapeado = mapTituloMercosToBravo(titulo, cnpj);

  await sendFaturasToBravo([tituloMapeado]);
}