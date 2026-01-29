function getCodigoFilialByRepresentada(representadaId) {
  switch (Number(representadaId)) {
    case 376068:
      return "1"; // Matriz AtlantiCordas
    case 382701:
      return "2"; // Filial RHPE
    default:
      return "1"; // Fallback
  }
}

function getCodigoVendedorCRM(representadaId, criadorId) {
  const idStr = String(criadorId); // Garantir string para match

  if (Number(representadaId) === 376068) { // Matriz
    if (idStr === "614297") return "118"; // Rafael Porto
    else if (idStr === "635050") return "18"; // André Augusto
    else if (idStr === "635052") return "33"; // Carlos Juan
    else if (idStr === "635055") return "49"; // Eduardo Siqueira
    else if (idStr === "635056") return "51"; // Elielson Ribeiro
    else if (idStr === "635057") return "56"; // Esdras Freitas
    else if (idStr === "635060") return "61"; // Fernando Silveira
    else if (idStr === "635065") return "74"; // Herry Guilherme
    else if (idStr === "635067") return "82"; // Jorge Leandro
    else if (idStr === "635080") return "127"; // Romulo Breno
    else if (idStr === "635114") return "116"; // Rafael Coutinho
    else if (idStr === "636808") return "46"; // EasyData Suporte
    else if (idStr === "637387") return "16"; // Anderson Medeiros
    else if (idStr === "643921") return "28"; // Bruno Rolim
    else if (idStr === "657650") return "133"; // Sandra Porto
    else if (idStr === "679718") return "142"; // Ubiratã de Sousa
    else if (idStr === "686638") return "30"; // Carla Pimentel
    else if (idStr === "695303") return "3"; // Adason Filho
    else if (idStr === "697081") return "153"; // Wellington dos Santos
    else if (idStr === "703818") return "101"; // Marcos Polary
    else if (idStr === "705118") return "79"; // João Aramiles
    else if (idStr === "712374") return "155"; // Yves Gabriel
    else if (idStr === "717565") return "149"; // Vinicius Wilson Castro
    else if (idStr === "721669") return "68"; // Gabriel Bastos
    else if (idStr === "723571") return "140"; // Túlio de Castro
    else if (idStr === "725092") return "102"; // Marcos Rogério
    else if (idStr === "731205") return "58"; // Fábio Dornelles
    else if (idStr === "734847") return "150"; // Welber Kleber
    else if (idStr === "734848") return "83"; // José Andrey
    else if (idStr === "734849") return "106"; // Mayara Ferreira
    else if (idStr === "734850") return "131"; // Samara Braga
    else if (idStr === "734851") return "87"; // Karen Silva
    else if (idStr === "734852") return "88"; // Larissa Ferreira
  } else if (Number(representadaId) === 382701) { // Filial
    if (idStr === "627498") return "118"; // Rafael Porto
    else if (idStr === "635460") return "1"; // Abel Filho
    else if (idStr === "635461") return "6"; // Alberto Chesme
    else if (idStr === "635462") return "11"; // Allan Lucas
    else if (idStr === "635463") return "17"; // Anderson Passos
    else if (idStr === "635464") return "19"; // Andre Brandao
    else if (idStr === "635466") return "18"; // André Augusto
    else if (idStr === "635467") return "33"; // Carlos Juan
    else if (idStr === "635468") return "37"; // Cledson Frota
    else if (idStr === "635469") return "40"; // Davi
    else if (idStr === "635470") return "49"; // Eduardo Siqueira
    else if (idStr === "635472") return "51"; // Elielson Ribeiro
    else if (idStr === "635473") return "56"; // Esdras Freitas
    else if (idStr === "635474") return "58"; // Fabio Dornelles
    else if (idStr === "635475") return "60"; // Fernando De Souza
    else if (idStr === "635477") return "61"; // Fernando Silveira
    else if (idStr === "635479") return "66"; // Francisco De Assis
    else if (idStr === "635481") return "70"; // Gilrobson
    else if (idStr === "635482") return "73"; // Henrique Vilanes
    else if (idStr === "635483") return "74"; // Herry Guilherme
    else if (idStr === "635484") return "76"; // Jair Gonçalves
    else if (idStr === "635485") return "82"; // Jorge Leandro
    else if (idStr === "635486") return "84"; // Jose Roberto
    else if (idStr === "635487") return "90"; // Leonardo Matos
    else if (idStr === "635488") return "98"; // Marcone Galize
    else if (idStr === "635489") return "107"; // Monclar Nascimento
    else if (idStr === "635490") return "110"; // Patricia Mary
    else if (idStr === "635491") return "111"; // Paulo Barbosa
    else if (idStr === "635492") return "112"; // Paulo Del Nero
    else if (idStr === "635494") return "117"; // Rafael Fialho
    else if (idStr === "635495") return "121"; // Ramon Padilha
    else if (idStr === "635496") return "122"; // Renato Bertuolo
    else if (idStr === "635497") return "123"; // Ricardo Midas
    else if (idStr === "635498") return "124"; // Ricardo Trigo
    else if (idStr === "635499") return "127"; // Romulo Breno
    else if (idStr === "635500") return "129"; // Rossano
    else if (idStr === "635501") return "130"; // Rubens Dinelli
    else if (idStr === "635502") return "135"; // Sidnei Figueiredo
    else if (idStr === "635503") return "152"; // Wellington Barros
    else if (idStr === "635504") return "154"; // Wilson Neto
    else if (idStr === "635505") return "116"; // Rafael Coutinho
    else if (idStr === "636809") return "46"; // EasyData Suporte
    else if (idStr === "637389") return "10"; // Alinne Oliveira
    else if (idStr === "637390") return "151"; // Welder Santos
    else if (idStr === "637391") return "16"; // Anderson Medeiros
    else if (idStr === "641071") return "65"; // Franciely - Mercos
    else if (idStr === "643116") return "134"; // Sandro Taglione
    else if (idStr === "643117") return "99"; // Marcos Dertinarti
    else if (idStr === "643128") return "145"; // Vanesca Andrea
    else if (idStr === "643926") return "28"; // Bruno Rolim
    else if (idStr === "645119") return "100"; // Marcos Paulo Americo
    else if (idStr === "645487") return "94"; // Luismar Sampaio
    else if (idStr === "646585") return "92"; // Luciano Ribeiro
    else if (idStr === "653281") return "126"; // Rogerio Barros
    else if (idStr === "653381") return "59"; // Fausto Luiz
    else if (idStr === "654693") return "148"; // Vinicius Castro
    else if (idStr === "655189") return "5"; // Ailton Freitas
    else if (idStr === "656537") return "113"; // Paulo Roberto
    else if (idStr === "656727") return "25"; // Bertran Landim
    else if (idStr === "657985") return "89"; // Leonardo Cabral
    else if (idStr === "659088") return "7"; // Alberto Pereira 
    else if (idStr === "660023") return "111"; // Paulo Barbosa
    else if (idStr === "660836") return "93"; // Luis Alexandre
    else if (idStr === "660860") return "120"; // Rafael Rodrigues
    else if (idStr === "661897") return "133"; // Sandra Porto
    else if (idStr === "663274") return "119"; // Rafael Porto (Testes)
    else if (idStr === "663964") return "114"; // Pedro Lucas Peixoto
    else if (idStr === "664866") return "31"; // Carlos Eduardo
    else if (idStr === "667097") return "119"; // Rafael Porto (Testes)
    else if (idStr === "667748") return "44"; // Douglas Araujo
    else if (idStr === "671946") return "75"; // Higor
    else if (idStr === "674153") return "77"; // Jean Pierry
    else if (idStr === "674166") return "67"; // Francisco Jose
    else if (idStr === "674278") return "115"; // Rafael Costa
    else if (idStr === "675028") return "21"; // Antonio Carlos
    else if (idStr === "675258") return "26"; // Bruno Gellis 
    else if (idStr === "675838") return "54"; // Erick Campisi
    else if (idStr === "677738") return "63"; // Flavio Maldonado
    else if (idStr === "679099") return "80"; // Joaquim Costa
    else if (idStr === "679536") return "128"; // Ronie Carvalho
    else if (idStr === "679717") return "142"; // Ubiratã de Sousa (mesmo que matriz)
    else if (idStr === "680339") return "32"; // Carlos Fernandes
    else if (idStr === "680342") return "139"; // Tiago Pereira
    else if (idStr === "680549") return "48"; // Ednaldo Junior
    else if (idStr === "680653") return "45"; // Duane Gonçalves
    else if (idStr === "681100") return "27"; // Bruno Rafael
    else if (idStr === "682925") return "55"; // Erivan Carvalho
    else if (idStr === "683544") return "143"; // Valci Mamedio
    else if (idStr === "685256") return "136"; // Thais Ranielli
    else if (idStr === "685385") return "3"; // Adason Filho
    else if (idStr === "686379") return "4"; // Adauto Falasca
    else if (idStr === "686635") return "30"; // Carla Pimentel
    else if (idStr === "686897") return "69"; // Gerson Graminha
    else if (idStr === "688690") return "62"; // Fernando Tamurejo
    else if (idStr === "688735") return "23"; // Antonio Melo
    else if (idStr === "688901") return "52"; // Elivan Morais
    else if (idStr === "688903") return "47"; // Edilson Pereira
    else if (idStr === "688924") return "43"; // Diego Gualber
    else if (idStr === "689438") return "15"; // Anderson Castro
    else if (idStr === "689497") return "147"; // Vieira Brasil
    else if (idStr === "690085") return "86"; // Junior Vilanes
    else if (idStr === "690086") return "71"; // Hebert Correia
    else if (idStr === "690293") return "53"; // Emerson Batista
    else if (idStr === "691374") return "72"; // Henrique Musler
    else if (idStr === "692583") return "41"; // Denison Souza
    else if (idStr === "692899") return "35"; // Cesar Sodre
    else if (idStr === "693147") return "44"; // Douglas Araujo
    else if (idStr === "693165") return "108"; // Neto Porto
    else if (idStr === "693665") return "9"; // Alexandro Gutz
    else if (idStr === "694672") return "42"; // Diego Flavio
    else if (idStr === "694843") return "144"; // Valdemir Batistella
    else if (idStr === "695050") return "96"; // Marcelo Do Nascimento
    else if (idStr === "695057") return "85"; // Junior Duarte
    else if (idStr === "696017") return "22"; // Antonio Marcos
    else if (idStr === "696026") return "34"; // Caze
    else if (idStr === "696191") return "24"; // Baruc Representaçoes
    else if (idStr === "697079") return "153"; // Wellington dos Santos
    else if (idStr === "697540") return "91"; // Lucas Tomás
    else if (idStr === "697543") return "146"; // Vicente Sales 
    else if (idStr === "697544") return "78"; // Joannderson Lucena
    else if (idStr === "698063") return "95"; // Magdiel Aires
    else if (idStr === "698894") return "8"; // Alessandro Ferreira
    else if (idStr === "700174") return "138"; // Tiago Dadalto
    else if (idStr === "701093") return "12"; // Allan Menezes
    else if (idStr === "702294") return "128"; // Ronie Carvalho
    else if (idStr === "702311") return "38"; // Cynthia Polonini
    else if (idStr === "702526") return "2"; // Adailton Pereira
    else if (idStr === "703171") return "43"; // Diego Gualber
    else if (idStr === "704751") return "13"; // Allan Michel
    else if (idStr === "705765") return "51"; // Elielson Ribeiro
    else if (idStr === "707138") return "123"; // Ricardo Midas
    else if (idStr === "707652") return "79"; // João Aramiles
    else if (idStr === "708648") return "132"; // Samuel  Junior
    else if (idStr === "709793") return "105"; // Mauricio Pereira
    else if (idStr === "709809") return "103"; // Maria Isabel
    else if (idStr === "710030") return "104"; // Mateus Leite
    else if (idStr === "710174") return "101"; // Marcos Polary
    else if (idStr === "710886") return "141"; // Tulio De Castro (note: variante de Túlio)
    else if (idStr === "711208") return "102"; // Marcos Rogério
    else if (idStr === "711840") return "50"; // Elias Rathes
    else if (idStr === "712037") return "109"; // Odair Mendes
    else if (idStr === "712039") return "39"; // Daniel Brito
    else if (idStr === "712375") return "155"; // Yves Gabriel
    else if (idStr === "713225") return "125"; // Rio Verde Representações
    else if (idStr === "716457") return "97"; // Marcio  Risso
    else if (idStr === "716693") return "71"; // Hebert Correia
    else if (idStr === "717265") return "149"; // Vinicius Wilson Castro
    else if (idStr === "719126") return "57"; // Fabio Barbosa 
    else if (idStr === "719927") return "29"; // Bruno Stringhini
    else if (idStr === "720091") return "14"; // Altamiro Barros
    else if (idStr === "721932") return "36"; // Claudio Amaral
    else if (idStr === "722485") return "81"; // Joaquim Neto
    else if (idStr === "722490") return "137"; // Thyago Jose
    else if (idStr === "723164") return "17"; // Anderson Passos
    else if (idStr === "726022") return "64"; // Flavio Milomes
    else if (idStr === "727427") return "20"; // Anny Silva
    else if (idStr === "730661") return "45"; // Duane Gonçalves
  }

  return "1"; // Fallback se não mapeado
}

export default function mapPedidoMercosToBravo(evento, pedido) {
  if (!pedido) return null;

  const codigoVendedorCRM = pedido.criador_id 
    ? getCodigoVendedorCRM(pedido.representada_id, pedido.criador_id)
    : "1"; // Fallback se sem criador_id

  return {
    codigo_filial: getCodigoFilialByRepresentada(pedido.representada_id),
    codigo_pedido: String(pedido.id),
    codigo_marca: "1",
    codigo_cliente: pedido.cliente_id ? String(pedido.cliente_id) : null,
    codigo_vendedor: codigoVendedorCRM, // Agora usa o CRM normalizado

    data_pedido:
      pedido.data_emissao ||
      pedido.data_criacao?.split(" ")[0] ||
      null,

    data_entrega: null,

    numero_documento: pedido.numero ? String(pedido.numero) : "",
    comprador: pedido.nome_contato || pedido.contato_nome || "",

    qtd_itens: Array.isArray(pedido.itens) ? pedido.itens.length : 0,
    qtd_itens_recusa: "",
    qtd_itens_faturado:
      evento === "pedido.faturado"
        ? Array.isArray(pedido.itens)
          ? pedido.itens.length
          : 0
        : "",

    total_bruto_pedido: Number(pedido.total) || 0,
    valor_total_desconto: "",
    total_pedido: Number(pedido.total) || 0,
    total_faturado:
      evento === "pedido.faturado" ? Number(pedido.total) || 0 : "",
    saldo_faturar:
      evento === "pedido.faturado" ? "" : Number(pedido.total) || 0,

    prazo: pedido.condicao_pagamento || "",
    parcelas: "",

    situacao:
      evento === "pedido.faturado"
        ? "Faturado"
        : "Aberto",

    // ⚠️ SEMPRE STRING
    considerar_venda: "S",

    observacoes_pedido: pedido.observacoes || "",

    pedido_campo_1: "",
    pedido_campo_2: "",
    pedido_campo_3: "",
    pedido_campo_4: "",
    pedido_campo_5: "",
  };
}