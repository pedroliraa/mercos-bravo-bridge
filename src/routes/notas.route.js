import express from "express";

const router = express.Router();

// TODO: implementar depois
router.post("/", (req, res) => res.status(200).json({ ok: true }));
router.post("/delete", (req, res) => res.status(200).json({ ok: true }));

export default router;
