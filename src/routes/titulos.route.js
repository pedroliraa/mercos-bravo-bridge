import express from "express";
import { handleWebhookTitulos } from "../controllers/titulos.controller.js";

const router = express.Router();

router.get(
  "/",
  (req, res, next) => {
    console.log("🧪 [ROUTE TITULOS] CHEGOU REQUEST");
    console.log("🧪 Method:", req.method);
    console.log("🧪 URL:", req.originalUrl);
    console.log("🧪 Body:", JSON.stringify(req.body, null, 2));
    next();
  },
  handleWebhookTitulos
);

export default router;