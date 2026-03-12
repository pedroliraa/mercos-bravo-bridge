import mongoose from "mongoose";

const ClienteSchema = new mongoose.Schema({
    
    mercos: {
        matriz: {
            type: Number,
            index: true
        },
        filial: {
            type: Number,
            index: true
        }
    },

    cnpj: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },

    criador_id: Number,

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
    },

    razao_social: String,
    nome_fantasia: String,

    cidade: String,
    estado: String,

    empresa: {
        type: String,
        enum: ["ATLANTIS", "RHPE"]
    },

    ultima_alteracao: Date,

    raw: {
        type: Object
    }

}, {
    timestamps: true
});

export default mongoose.model("Cliente", ClienteSchema);