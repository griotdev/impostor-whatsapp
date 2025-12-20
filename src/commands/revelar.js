const state = require('../gameState');
const { getChatId } = require('../utils');

module.exports = {
    name: 'revelar',
    execute: async (message, client) => {
        // Permite revelar se estiver JOGANDO ou se tiver dados de jogo recente (caso tenha "fechado" acidentalmente, embora o estado só feche no revelar)
        if (state.status !== 'JOGANDO') {
            // Se o usuário tenta revelar sem jogo ativo
            console.log("Tentativa de revelar sem jogo ativo.");
            // Opcional: permitir se existir state.jogoAtual.impostor na memoria
        }

        if (!state.jogoAtual.impostor && !state.jogoAtual.palavraSecreta && !state.jogoAtual.perguntaComum) {
            await message.reply("❌ Nenhum jogo ativo para revelar.");
            return;
        }

        const chatId = getChatId(message);
        if (state.idGrupoPermitido && chatId !== state.idGrupoPermitido) return;

        let textoRevelacao = `🤡 *FIM DE JOGO!* 🤡\n\n`;

        if (state.modo === 'CLASSICO') {
            textoRevelacao += `A palavra secreta era: *${state.jogoAtual.palavraSecreta}*\n`;
        } else {
            // Modo Perguntas
            textoRevelacao += `Pergunta Comum: *${state.jogoAtual.perguntaComum}*\n`;
            textoRevelacao += `Pergunta do Impostor: *${state.jogoAtual.perguntaImpostor}*\n`;
        }

        textoRevelacao += `\nO Impostor era: *${state.jogoAtual.impostor ? state.jogoAtual.impostor.nome : '???'}*!`;

        await client.sendMessage(chatId, textoRevelacao);
        await client.sendMessage(chatId, "Quem acertou?");

        // Reset
        state.reset();
    }
};
