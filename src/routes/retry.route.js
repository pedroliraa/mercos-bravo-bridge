import express from "express";
import { handleRetryFailed } from "../controllers/retry.controller.js";

const router = express.Router();

router.get(
  "/",
  (req, res, next) => {
    console.log("🧪 [ROUTE RETRY] CHEGOU REQUEST");
    console.log("🧪 Method:", req.method);
    console.log("🧪 URL:", req.originalUrl);
    next();
  },
  handleRetryFailed
);

export default router;
