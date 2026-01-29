import express from "express";

import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";
import { handleRetryFailed } from "../src/controllers/retry.controller.js";

import { connectMongo } from "../src/database/mongo.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

app.use(express.json({ limit: "5mb" }));

// Webhooks
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);
app.use("/api/retry-failed", handleRetryFailed);

// Fallback pra qualquer rota não encontrada (local e Vercel)
app.all("*", (req, res) => {
  res.status(404).json({ error: "Not found - use /webhook/clientes, /webhook/pedidos or /api/retry-failed" });
});

// Ambiente local: inicia na porta
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;