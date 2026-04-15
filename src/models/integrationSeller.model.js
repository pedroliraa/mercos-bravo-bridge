import mongoose from "mongoose";

const IntegrationSellerSchema = new mongoose.Schema(
  {
    // =========================
    // MERCOS
    // =========================
    mercos: {
      matriz: {
        type: Number,
        index: true
      },
      filial: {
        type: Number,
        index: true
      },
      atomy: { 
        type: Number, 
        index: true 
      },
      ankorfit: { 
        type: Number, 
        index: true 
      }
    },

    // =========================
    // BRAVO
    // =========================
    bravoSellerCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // =========================
    // DADOS
    // =========================
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "IntegrationSeller",
  IntegrationSellerSchema
);