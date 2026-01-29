import express from "express";

import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";
import router from "../src/routes/index.js"; // Seu router com retry

import { connectMongo } from "../src/database/mongo.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

app.use(express.json({ limit: "5mb" }));

// Webhooks específicos (mantém como está)
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);

// Monta TODAS as outras rotas (inclui /api/retry-failed) no root
app.use("/", router);

// Vercel serverless: export direto (sem listen local aqui)
export default app;

// Ambiente local (só roda se não for Vercel)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}