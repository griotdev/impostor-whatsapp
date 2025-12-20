const state = require('../gameState');
const { getChatId } = require('../utils');

module.exports = {
    name: 'parar',
    execute: async (message, client) => {
        // Verifica se tem permissão (Admin ou chat permitido)
        // Se estiver FECHADO, nada pra parar.
        if (state.status === 'FECHADO') {
            await message.reply('❌ Não há jogo ativo para parar.');
            return;
        }

        const chatId = getChatId(message);

        // Se já tem um grupo definido, só aceita comando dele
        if (state.idGrupoPermitido && chatId !== state.idGrupoPermitido) {
            return;
        }

        state.reset();
        await client.sendMessage(chatId, '🛑 *JOGO PARADO/CANCELADO!* 🛑\n\nTodas as informações foram resetadas.');
    }
};
