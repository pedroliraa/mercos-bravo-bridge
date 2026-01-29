import { handlePedido } from "./pedido.handler.js";
import { handleCliente } from "./cliente.handler.js";

export const integrationHandlers = {
  // PEDIDOS
  "pedido.gerado": handlePedido,
  "pedido.faturado": handlePedido,
  "pedido.cancelado": handlePedido,

  // CLIENTES
  "cliente.criado": handleCliente,
  "cliente.atualizado": handleCliente,
  "cliente.excluido": handleCliente,

  // NOTA → propositalmente fora por enquanto
};
