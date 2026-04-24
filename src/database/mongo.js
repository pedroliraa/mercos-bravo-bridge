import mongoose from "mongoose";
import { env } from "../config/env.js";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGO_URI, {
      bufferCommands: false,

      // 🔥 ESSENCIAIS PRA SCRIPT PESADO
      serverSelectionTimeoutMS: 30000, // tempo pra conectar
      socketTimeoutMS: 45000,         // tempo de operação
      maxPoolSize: 5,                 // limita conexões simultâneas

    }).then((mongoose) => {
      console.log("🟢 Mongo conectado");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}