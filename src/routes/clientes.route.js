import express from "express";
import { handleClienteWebhook } from "../controllers/clientes.controller.js";

const router = express.Router();

router.post(
  "/",
  (req, res, next) => {
    console.log("🧪 [ROUTE CLIENTES] CHEGOU REQUEST");
    console.log("🧪 Method:", req.method);
    console.log("🧪 URL:", req.originalUrl);
    console.log("🧪 Body:", JSON.stringify(req.body, null, 2));
    next();
  },
  handleClienteWebhook
);

export default router;
