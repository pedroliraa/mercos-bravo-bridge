import express from "express";
import clientesRoute from "./clientes.route.js";
import pedidosRoute from "./pedidos.route.js";
import { handleRetryFailed } from "../controllers/retry.controller.js";

const router = express.Router();

router.use("/clientes", clientesRoute);
router.use("/pedidos", pedidosRoute);

// Rota retry normal (não serverless, funciona local e Vercel)
router.get("/api/retry-failed", handleRetryFailed);

export default router;