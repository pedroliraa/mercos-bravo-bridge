import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";
import notasRoute from "./notas.route.js";

const router = express.Router();

router.use("/clientes", clientesRoute);
router.use("/pedidos", pedidosRoute);
router.use("/notas", notasRoute);

export default router;
