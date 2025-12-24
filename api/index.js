import express from "express";

import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";

const app = express();

app.use(express.json({ limit: "5mb" }));

// Rotas
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);

// ===============
//  AMBIENTE LOCAL
// ===============
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// ===============
//  SERVLESS (VERCEL)
// ===============
export default app;
