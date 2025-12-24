import express from "express";
import { handlePedidoWebhook } from "../controllers/pedidos.controller.js";

const router = express.Router();

router.post("/", (req, res, next) => {
  console.log("🧪 [ROUTE PEDIDOS] CHEGOU REQUEST");
  next();
}, handlePedidoWebhook);

router.post("/delete", (req, res) => {
  return res.status(200).json({ ok: true });
});

export default router;
