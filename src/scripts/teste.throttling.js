import { getMercosSellerById } from "../services/mercosApi.js";

console.time("teste-concorrencia");

try {
  await Promise.all([
    getMercosSellerById(1),
  ]);

  console.log("Finalizou todas as requisições");
} catch (err) {
  console.error("Erro final:", err.message);
}

console.timeEnd("teste-concorrencia");