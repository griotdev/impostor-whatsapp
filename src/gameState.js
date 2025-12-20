// Initial State
const state = {
    status: 'FECHADO', // 'FECHADO', 'SELECIONANDO_MODO', 'ABERTO', 'JOGANDO'
    modo: null, // 'CLASSICO' (1) or 'PERGUNTAS' (2)
    participantes: [],
    idGrupoPermitido: null,
    jogoAtual: {
        categoria: null,
        palavraSecreta: null, // Used in Classic
        perguntaComum: null,  // Used in Questions
        perguntaImpostor: null, // Used in Questions
        impostor: null
    }
};

module.exports = state;
