import mongoose from "mongoose";

const integrationEventSchema = new mongoose.Schema({
  source: { type: String, required: true },           // "mercos"
  entityType: { type: String, required: true },       // "nota", "pedido", "cliente"
  entityId: { type: String, required: true },         // ex: "139030837"
  eventType: { type: String, required: true },        // "pedido.faturado"
  payload: { type: Object, required: true },          // dados completos do webhook
  status: { 
    type: String, 
    enum: ["PENDING", "PROCESSING", "PROCESSED", "ERROR", "FAILED"],
    default: "PENDING" 
  },
  error: { type: String, default: null },
  retryCount: { type: Number, default: 0 },
  lastAttempt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("IntegrationEvent", integrationEventSchema);