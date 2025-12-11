import express from "express";
import { handleClienteWebhook } from "../controllers/clientes.controller.js";

const router = express.Router();

router.post("/", handleClienteWebhook);

export default router;
