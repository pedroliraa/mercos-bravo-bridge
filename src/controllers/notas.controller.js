import { mapNotaMercosToBravo } from "../mappers/mapNotaMercosToBravo.js";
import logger from "../utils/logger.js";

/**
 * Controller interno de Nota
 * É chamado a partir do pedidos.controller quando evento = pedido.faturado
 */
export function handleNotaFromPedido(pedido) {
  if (!pedido) {
    logger?.warn?.("⚠️ Nota não gerada: pedido vazio");
    return null;
  }

  logger?.info?.(
    "🧾 Gerando nota a partir de pedido faturado:",
    pedido.id
  );

  const notaMapped = mapNotaMercosToBravo(pedido);

  logger?.info?.(
    "📤 Nota mapeada:",
    notaMapped?.codigo_nota ?? "(sem código)"
  );

  return notaMapped;
}
