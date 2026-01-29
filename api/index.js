import express from "express";

import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";
import router from "../src/routes/index.js";  // ← Importa o router com retry

import { connectMongo } from "../src/database/mongo.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

app.use(express.json({ limit: "5mb" }));

// Webhooks
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);

// Monta o router principal (retry e outras rotas)
app.use("/", router);  // ← ESSA LINHA TEM QUE ESTAR AQUI

// Ambiente local
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;