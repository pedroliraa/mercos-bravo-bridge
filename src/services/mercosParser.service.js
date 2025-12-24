// src/services/mercosParser.service.js

export function parseMercosPayload(payload, tipo) {
  if (!payload) return [];

  // 🔹 Caso Mercos envie array direto
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      evento: item.evento || `${tipo}.atualizado`,
      dados: item.dados || item,
    }));
  }

  // 🔹 Caso Mercos envie objeto com lista interna
  if (Array.isArray(payload.eventos)) {
    return payload.eventos.map((item) => ({
      evento: item.evento || `${tipo}.atualizado`,
      dados: item.dados || item,
    }));
  }

  // 🔹 Caso Mercos envie objeto único
  return [
    {
      evento: payload.evento || `${tipo}.atualizado`,
      dados: payload.dados || payload,
    },
  ];
}
