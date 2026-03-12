import express from "express";
import router from "../src/routes/index.js";
import { connectMongo } from "../src/database/mongo.js";
import { env } from "../src/config/env.js";
import logger from "../src/utils/logger.js";

const app = express();

await connectMongo();
console.log("✅ Mongo conectado");

logger.info(`🚀 Aplicação iniciada em modo: ${env.APP_ENV}`);
logger.info(`🔗 Mercos baseURL: ${env.MERCOS_URL}`);

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
