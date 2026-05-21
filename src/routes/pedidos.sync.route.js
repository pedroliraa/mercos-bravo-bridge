import express from "express";
import { syncPedidosAlterados } from "../controllers/pedidos.sync.controller.js";

const router = express.Router();

router.get("/", (req, res, next) => {
  console.log("🧪 [ROUTE PEDIDOS SYNC] CHEGOU REQUEST");
  next();
}, syncPedidosAlterados);

router.post("/delete", (req, res) => {
  return res.status(200).json({ ok: true });
});

export default router;
