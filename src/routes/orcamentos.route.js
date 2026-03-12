import express from "express";
import { handleWebhookOrcamentos } from "../controllers/orcamentos.controller.js";

const router = express.Router();

router.get(
  "/",
  (req, res, next) => {
    console.log("🧪 [ROUTE ORCAMENTOS] CHEGOU REQUEST");
    console.log("🧪 Method:", req.method);
    console.log("🧪 URL:", req.originalUrl);
    next();
  },
  handleWebhookOrcamentos
);

export default router;