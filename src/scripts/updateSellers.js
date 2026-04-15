import { env } from "../config/env.js";

import mongoose from "mongoose";
import integrationSellerModel from "../models/integrationSeller.model.js";

await mongoose.connect(env.MONGO_URI);

// =====================
// DADOS
// =====================

const atomy = [
  { id: 727853, email: "rafael@grupoforce.com.br" },
  { id: 728638, email: "vinicius@vendasimplesct.com.br" },
  { id: 736153, email: "comercial02@grupoforce.com.br" },
  { id: 736161, email: "vendas02@grupoforce.com.br" },
  { id: 736162, email: "vendas05@grupoforce.com.br" },
  { id: 736163, email: "vendas03@grupoforce.com.br" },
  { id: 736164, email: "vendas06@grupoforce.com.br" },
  { id: 736680, email: "laurapeluci.atomy@gmail.com" },
  { id: 742431, email: "analise.financeiro@grupoforce.com.br" },
  { id: 744430, email: "vendas04@grupoforce.com.br" }
];

const ankorfit = [
  { id: 727854, email: "rafael@grupoforce.com.br" },
  { id: 736144, email: "ankorfix@ankorfix.com.br" },
  { id: 736155, email: "comercial02@grupoforce.com.br" },
  { id: 736166, email: "vendas02@grupoforce.com.br" },
  { id: 736167, email: "vendas05@grupoforce.com.br" },
  { id: 736168, email: "vendas03@grupoforce.com.br" },
  { id: 741528, email: "vinicius@vendasimplesct.com.br" },
  { id: 742430, email: "analise.financeiro@grupoforce.com.br" },
  { id: 744429, email: "vendas04@grupoforce.com.br" }
];

// =====================
// FUNÇÃO
// =====================

async function processEmpresa(lista, empresa) {
  for (const item of lista) {
    let seller = await integrationSellerModel.findOne({ email: item.email });

    if (!seller) {
      console.log(`🆕 Criando vendedor: ${item.email}`);

      seller = await integrationSellerModel.create({
        name: item.email, 
        email: item.email,
        bravoSellerCode: `BRAVO_${item.id}`,
        mercos: {
          [empresa]: item.id
        }
      });
    } else {
      console.log(`🔄 Atualizando ${empresa}: ${item.email}`);

      seller.mercos[empresa] = item.id;
      await seller.save();
    }
  }
}

// =====================
// EXECUÇÃO
// =====================

await processEmpresa(atomy, "atomy");
await processEmpresa(ankorfit, "ankorfit");

console.log("✅ Finalizado");
process.exit();