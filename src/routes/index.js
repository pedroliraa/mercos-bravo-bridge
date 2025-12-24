import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";

const router = express.Router();

router.use("/clientes", clientesRoute);
router.use("/pedidos", pedidosRoute);

export default router;
