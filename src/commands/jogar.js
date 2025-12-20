const state = require('../gameState');
const { getChatId, delay } = require('../utils');
const fs = require('fs');
const path = require('path');

// Carrega dados JSON
let bancoPalavras = {};
let bancoPerguntas = {};

try {
    bancoPalavras = require('../../palavras.json');
} catch (e) {
    console.error("Erro ao carregar palavras.json:", e);
}

try {
    bancoPerguntas = require('../../perguntas.json');
} catch (e) {
    console.error("Erro ao carregar perguntas.json:", e);
}

module.exports = {
    name: 'jogar',
    execute: async (message, client) => {
        if (state.status !== 'ABERTO') return;
        if (getChatId(message) !== state.idGrupoPermitido) return;

        if (state.participantes.length < 3) {
            await message.reply("❌ Precisa de pelo menos 3 pessoas para jogar!");
            return;
        }

        const args = message.body.trim().split(/\s+/);
        if (args.length < 2) {
            await message.reply("❌ Por favor especifique a categoria! Exemplo: `!jogar comida`");
            return;
        }

        const categoriaEscolhida = args[1].toLowerCase();

        // --- SELEÇÃO DE DADOS BASEADA NO MODO ---

        if (state.modo === 'CLASSICO') {
            if (!bancoPalavras[categoriaEscolhida]) {
                const keys = Object.keys(bancoPalavras).join(', ');
                await message.reply(`❌ Categoria '${categoriaEscolhida}' não encontrada! Use: ${keys}`);
                return;
            }

            const lista = bancoPalavras[categoriaEscolhida];
            state.jogoAtual.palavraSecreta = lista[Math.floor(Math.random() * lista.length)];
            state.jogoAtual.categoria = categoriaEscolhida;

        } else if (state.modo === 'PERGUNTAS') {
            if (!bancoPerguntas[categoriaEscolhida]) {
                const keys = Object.keys(bancoPerguntas).join(', ');
                await message.reply(`❌ Categoria '${categoriaEscolhida}' não encontrada! Use: ${keys}`);
                return;
            }

            const lista = bancoPerguntas[categoriaEscolhida];
            const parSorteado = lista[Math.floor(Math.random() * lista.length)];

            state.jogoAtual.perguntaComum = parSorteado.comum;
            state.jogoAtual.perguntaImpostor = parSorteado.impostor;
            state.jogoAtual.categoria = categoriaEscolhida;
        }

        // --- SELEÇÃO DO IMPOSTOR ---
        const indiceImpostor = Math.floor(Math.random() * state.participantes.length);
        const impostor = state.participantes[indiceImpostor];
        state.jogoAtual.impostor = impostor;

        state.status = 'JOGANDO';

        await message.reply(`🎲 *Sorteio Realizado!* Enviando mensagens no privado... 🤫
        
(Aguardem todos receberem antes de responderem)`);

        console.log(`\n--- JOGO INICIADO (${state.modo}) ---`);
        console.log(`Categoria: ${categoriaEscolhida}`);
        console.log(`Impostor: ${impostor.nome}`);

        // --- ENVIO ---
        const errosEnvio = [];

        for (let p of state.participantes) {
            const ehImpostor = (p.idSeguro === impostor.idSeguro);
            let texto = "";

            if (state.modo === 'CLASSICO') {
                if (ehImpostor) {
                    texto = `🤫 *TU ÉS O IMPOSTOR!* 🤫
                    
O tema é: *${categoriaEscolhida.toUpperCase()}*
Seu objetivo é descobrir a palavra secreta e enganar todos para que não descubram você.

Boa sorte!`;
                } else {
                    texto = `😇 *VOCÊ É INOCENTE!*
                    
O tema é: *${categoriaEscolhida.toUpperCase()}*
A palavra secreta é: *${state.jogoAtual.palavraSecreta}*

Descubra quem é o impostor (ele não sabe a palavra)!`;
                }
            } else {
                // MODO PERGUNTAS
                // O impostor NÃO SABE que é impostor
                const pergunta = ehImpostor ? state.jogoAtual.perguntaImpostor : state.jogoAtual.perguntaComum;

                texto = `🤔 *PERGUNTA DO JOGO*
                
Categoria: *${categoriaEscolhida.toUpperCase()}*

Responda: *${pergunta}*

(Não revele sua pergunta exata, apenas dê a resposta!)`;
            }

            // Lógica de Envio Safa
            try {
                let idParaEnvio = p.idSeguro;
                if (!idParaEnvio.includes('@')) {
                    // Tenta recuperar ID se for antigo (compatibilidade)
                    const contactId = await client.getNumberId(p.numero);
                    idParaEnvio = contactId ? contactId._serialized : `${p.numero}@c.us`;
                }

                const msgEnviada = await client.sendMessage(idParaEnvio, texto);

                // Anti-flood
                await delay(1000);

                // Deletar msg admin
                if (idParaEnvio !== client.info.wid._serialized) {
                    try {
                        await msgEnviada.delete(false);
                    } catch (e) { /* ignore delete error */ }
                }

            } catch (err) {
                console.error(`❌ Erro envio para ${p.nome}:`, err.message);
                errosEnvio.push(p.nome);
            }
        }

        if (errosEnvio.length > 0) {
            await client.sendMessage(state.idGrupoPermitido, `⚠️ Falha ao enviar para: ${errosEnvio.join(', ')}.`);
        } else {
            if (state.modo === 'CLASSICO') {
                await client.sendMessage(state.idGrupoPermitido, `✅ *Todos receberam!* Discutam e votem!\nUse *!revelar* no fim.`);
            } else {
                await client.sendMessage(state.idGrupoPermitido, `✅ *Todos receberam suas perguntas!*
                
Mandem suas respostas aqui no grupo!
Depois tentem adivinhar quem recebeu a pergunta diferente.

Use *!revelar* para ver quem era o impostor.`);
            }
        }
    }
};
