const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const state = require('./src/gameState');

// Import Commands
const cmdIniciar = require('./src/commands/iniciar');
const cmdParticipar = require('./src/commands/participar');
const cmdJogar = require('./src/commands/jogar');
const cmdRevelar = require('./src/commands/revelar');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot Impostor Modular Online!');
});

client.on('message_create', async (message) => {
    if (!message.body) return;

    const bodyRef = message.body.trim();
    const bodyLower = bodyRef.toLowerCase();

    // 1. SELECT MODE (Middleware logic)
    if (state.status === 'SELECIONANDO_MODO') {
        // Verifica se é o chat certo
        if (message.getChatId && message.getChatId() !== state.idGrupoPermitido) return; // Método getChatId não existe no msg, usei utils na v1
        // Melhor usar a logica do utils ou verificar raw properties
        const msgChatId = message.fromMe ? message.to : message.from;
        if (msgChatId === state.idGrupoPermitido) {
            if (bodyRef === '1' || bodyRef === '2') {
                await cmdIniciar.confirmarModo(message, client);
                return;
            }
        }
    }

    // 2. ROUTING
    if (bodyRef === '!iniciar') {
        await cmdIniciar.execute(message, client);
    }
    else if (bodyLower.startsWith('!participar')) {
        await cmdParticipar.execute(message, client);
    }
    else if (bodyLower.startsWith('!jogar')) {
        await cmdJogar.execute(message, client);
    }
    else if (bodyRef === '!revelar') {
        await cmdRevelar.execute(message, client);
    }

});

client.initialize();