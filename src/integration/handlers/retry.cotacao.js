export async function handleRetryCotacao(pedido) {

  logger.info(`🔁 [RETRY COTACAO] Reprocessando ${pedido.id}`);

  const seller = pedido?.criador_id
    ? await resolveSellerByMercosId(pedido.criador_id)
    : null;

  const codigoVendedorCRM = seller?.bravoSellerCode || "1";

  const cotacaoMapeada =
    mapPedidoMercosToBravoCotacao(pedido, codigoVendedorCRM);

  const produtosMap = {};

  const itensMapeados =
    mapItensParaCotacaoItemBravo(pedido, produtosMap);

  await sendCotacoesToBravo([cotacaoMapeada]);

  if (itensMapeados.length) {
    await sendCotacaoItensToBravo(itensMapeados);
  }

  if (pedido.cliente_cnpj) {
    await sendMarcaToBravo({
      codigo_cliente: pedido.cliente_cnpj.toString(),
      codigo_marca: "1",
      codigo_vendedor: codigoVendedorCRM,
      codigo_vendedor2: "",
      codigo_gestor: "",
      restricao: "",
      categoria_carteira: "",
      marca_campo_1: "",
      marca_campo_2: "",
      marca_campo_3: "",
      marca_campo_4: "",
      marca_campo_5: "",
    });
  }
}