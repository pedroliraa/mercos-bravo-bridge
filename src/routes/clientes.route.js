import express from "express";
import { handleClienteWebhook, handleClienteDelete } from "../controllers/clientes.controller.js";

const router = express.Router();

router.post("/", handleClienteWebhook);
router.post("/delete", handleClienteDelete);

export default router;
