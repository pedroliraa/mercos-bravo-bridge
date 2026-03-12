import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";
import retryRoute from "./retry.route.js";
import titulosRoute from "./titulos.route.js";
import orcamentosRoute from "./orcamentos.route.js";

const router = express.Router();

// webhooks
router.use("/webhook/clientes", clientesRoute);
router.use("/webhook/pedidos", pedidosRoute);
router.use("/webhook/titulos", titulosRoute);
router.use("/webhook/orcamentos", orcamentosRoute);

// retry
router.use("/retry", retryRoute);

export default router;
