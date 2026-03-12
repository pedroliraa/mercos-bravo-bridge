import Cliente from "../models/integrationClient.model.js";
import logger from "../utils/logger.js";
import Seller from "../models/integrationSeller.model.js";

/**
 * 🔹 Salva ou atualiza cliente vindo do Mercos
 */
export async function saveOrUpdateClienteMercos(clienteMercos, empresa) {
    
    try {

        if (!clienteMercos?.id) {
            logger.warn("[CLIENTE] Cliente Mercos inválido");
            return null;
        }

        const mercosId = clienteMercos.id;

        const cnpj = clienteMercos.cnpj?.replace(/\D/g, "") || null;

        let sellerId = null;

        if (clienteMercos.criador_id) {

            const seller = await Seller.findOne({
                $or: [
                    { mercosId_matriz: clienteMercos.criador_id },
                    { mercosId_filial: clienteMercos.criador_id }
                ]
            });

            if (seller) {
                sellerId = seller._id;
            }

        }

        // 🔹 define se é matriz ou filial
        const mercosField =
            empresa === "ATLANTIS"
                ? { "mercos.matriz": mercosId }
                : { "mercos.filial": mercosId };

        const cliente = await Cliente.findOneAndUpdate(

            { cnpj },

            {
                $set: {
                    ...mercosField,
                    cnpj,
                    criador_id: clienteMercos.criador_id,
                    seller: sellerId,
                    razao_social: clienteMercos.razao_social,
                    nome_fantasia: clienteMercos.nome_fantasia,
                    cidade: clienteMercos.cidade,
                    estado: clienteMercos.estado,
                    empresa,
                    ultima_alteracao: clienteMercos.ultima_alteracao
                        ? new Date(clienteMercos.ultima_alteracao)
                        : null,
                    raw: clienteMercos
                }
            },

            {
                upsert: true,
                new: true
            }

        );

        return cliente;

    } catch (error) {

        logger.error("[CLIENTE] Erro ao salvar cliente", error);
        throw error;

    }

}
/**
 * 🔹 Busca CNPJ pelo mercosId
 */
export async function getCnpjByMercosClienteId(mercosId) {
    try {

        if (!mercosId) {
            logger.warn("[CLIENTE] mercosId não informado.");
            return null;
        }

        logger.info(`[CLIENTE] Buscando cliente no Mongo mercosId=${mercosId}`);

        const cliente = await Cliente.findOne({
            $or: [
                { "mercos.matriz": mercosId },
                { "mercos.filial": mercosId }
            ]
        });

        if (!cliente) {
            logger.warn(`[CLIENTE] Cliente não encontrado mercosId=${mercosId}`);
            return null;
        }

        logger.info(
            `[CLIENTE] Cliente encontrado mercosId=${mercosId} CNPJ=${cliente.cnpj}`
        );

        return cliente.cnpj || null;

    } catch (error) {

        logger.error(
            `[CLIENTE] Erro ao buscar cliente no Mongo mercosId=${mercosId}`,
            error
        );

        return null;
    }
}