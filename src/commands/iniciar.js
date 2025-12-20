const state = require('../gameState');
const { getChatId } = require('../utils');

module.exports = {
    name: 'iniciar',
    execute: async (message, client) => {
        if (state.status !== 'FECHADO') {
            await message.reply('❌ Já existe um jogo rolando ou em configuração! Digite !revelar (se estiver jogando) ou reinicie o bot.');
            return;
        }

        // Lock chat
        state.idGrupoPermitido = getChatId(message);
        state.status = 'SELECIONANDO_MODO';
        state.participantes = [];
        state.jogoAtual = { categoria: null, palavraSecreta: null, perguntaComum: null, perguntaImpostor: null, impostor: null };
        state.modo = null;

        await client.sendMessage(state.idGrupoPermitido, `🕵️ *JOGO DO IMPOSTOR* 🕵️
        
Qual modo de jogo vocês querem?

1️⃣ - *Clássico* (Palavras)
2️⃣ - *Perguntas* (Quem é o impostor por perguntas)

*Responda com 1 ou 2.*`);
    },

    confirmarModo: async (message, client) => {
        const opcao = message.body.trim();
        const chatId = getChatId(message);

        if (chatId !== state.idGrupoPermitido) return;

        if (opcao === '1' || opcao === '2') {
            state.modo = opcao === '1' ? 'CLASSICO' : 'PERGUNTAS';
            state.status = 'ABERTO';

            const nomeModo = state.modo === 'CLASSICO' ? 'CLÁSSICO (Palavras)' : 'PERGUNTAS';

            // Carregar categorias dinamicamente
            let categorias = [];
            try {
                if (state.modo === 'CLASSICO') {
                    const dados = require('../../palavras.json');
                    categorias = Object.keys(dados);
                } else {
                    const dados = require('../../perguntas.json');
                    categorias = Object.keys(dados);
                }
            } catch (e) {
                console.error("Erro ao ler JSON de categorias:", e);
                categorias = ["(Erro ao carregar categorias)"];
            }

            const listaCategorias = categorias.map(c => `• ${c}`).join('\n');

            await client.sendMessage(state.idGrupoPermitido, `✅ Modo *${nomeModo}* selecionado!
            
Para participar, responda aqui com:
*!participar*

(Não precisa de número nem dica)

*Quando todos entrarem, o Admin deve digitar:*
!jogar [categoria]

*Categorias Disponíveis:*
${listaCategorias}

(bot feito pelo André)`);
        } else {
            await message.reply('❌ Opção inválida! Responda com *1* para Clássico ou *2* para Perguntas.');
        }
    }
};
