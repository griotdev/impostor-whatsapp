const state = require('../gameState');
const { getChatId, getAuthorId } = require('../utils');

module.exports = {
    name: 'participar',
    execute: async (message, client) => {
        if (state.status !== 'ABERTO') return;
        if (getChatId(message) !== state.idGrupoPermitido) return;

        // --- 1. Identificação ---
        let idAutor = getAuthorId(message, client);
        let nome = "Participante";
        let numeroPuro = idAutor.replace(/\D/g, '');

        if (message.fromMe) {
            nome = client.info.pushname || "Admin";
        } else if (message._data && message._data.notifyName) {
            nome = message._data.notifyName;
        }

        // --- 2. Cadastro ---
        const jaParticipando = state.participantes.some(p => p.idSeguro === idAutor);

        if (jaParticipando) {
            await message.reply(`Ei ${nome}, você já está na lista!`);
        } else {
            state.participantes.push({
                nome: nome,
                numero: numeroPuro,
                idSeguro: idAutor
            });

            console.log(`➕ Novo participante: ${nome} (ID: ${idAutor})`);
            await message.react('✅');
        }
    }
};
