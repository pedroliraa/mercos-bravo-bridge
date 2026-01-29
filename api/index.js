import express from "express";
import router from "../src/routes/index.js";
import { connectMongo } from "../src/database/mongo.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

app.use(express.json({ limit: "5mb" }));

// TODAS as rotas passam pelo router
app.use("/", router);

// local only
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
