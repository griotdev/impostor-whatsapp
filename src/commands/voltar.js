const state = require('../gameState');
const { getChatId } = require('../utils');

module.exports = {
    name: 'voltar',
    execute: async (message, client) => {
        const chatId = getChatId(message);

        // Verifica chat correto
        if (state.idGrupoPermitido && chatId !== state.idGrupoPermitido) return;

        if (state.status === 'FECHADO') {
            return; // Nada para voltar
        }

        if (state.status === 'SELECIONANDO_MODO') {
            // Voltar da seleção de modo -> Cancelar
            state.reset();
            await client.sendMessage(chatId, '🔙 *Cancelado.* Voltamos ao início (Sem jogo).');
            return;
        }

        if (state.status === 'ABERTO') {
            // Voltar do Lobby -> Seleção de Modo
            state.status = 'SELECIONANDO_MODO';
            state.modo = null;
            state.participantes = []; // CONFORME SOLICITADO: Limpar lista

            await client.sendMessage(chatId, `🔙 *Voltando para seleção de modo...*
            
1️⃣ - *Clássico* (Palavras)
2️⃣ - *Perguntas* (Quem é o impostor por perguntas)

*Responda com 1 ou 2.*`);
            return;
        }

        if (state.status === 'JOGANDO') {
            // Voltar do Jogo -> Lobby (Abortar rodada mas manter participantes? Ou resetar tudo?)
            // O user pediu "navegar entre menus". Durante o jogo não tem menu.
            // Vou assumir que !voltar durante o jogo é perigoso/ambíguo. Melhor usar !parar.
            // Mas posso fazer voltar ao status 'ABERTO' mantendo participantes, caso queiram re-sortear

            state.status = 'ABERTO';
            state.jogoAtual = { categoria: null, palavraSecreta: null, perguntaComum: null, perguntaImpostor: null, impostor: null };

            await client.sendMessage(chatId, `🔙 *Jogo Cancelado! Voltamos ao Lobby.*
             
Participantes mantidos: ${state.participantes.length}
Digite *!jogar [categoria]* para tentar de novo ou *!voltar* para mudar o modo.`);
        }
    }
};
