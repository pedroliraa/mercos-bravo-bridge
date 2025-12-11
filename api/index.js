import express from "express";
import clientesRoute from "../src/routes/clientes.route.js";
import pedidosRoute from "../src/routes/pedidos.route.js";
import notasRoute from "../src/routes/notas.route.js";
import contatosRoute from "../src/routes/contatos.route.js";

const app = express();

// Captura JSON normalmente
app.use(express.json({ limit: "5mb" }));

// Aqui você configura os endpoints externos da Mercos
app.use("/webhook/clientes", clientesRoute);
app.use("/webhook/pedidos", pedidosRoute);
app.use("/webhook/notas", notasRoute);
app.use("/webhook/contatos", contatosRoute);

// Vercel precisa exportar o app como handler
export default app;
