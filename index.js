const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const state = require('./src/gameState');

// Import Commands
const cmdIniciar = require('./src/commands/iniciar');
const cmdParticipar = require('./src/commands/participar');
const cmdJogar = require('./src/commands/jogar');
const cmdRevelar = require('./src/commands/revelar');
const cmdParar = require('./src/commands/parar');
const cmdVoltar = require('./src/commands/voltar');

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

    // Comandos Prioritários (Cancelamento/Navegação)
    if (bodyLower === '!parar') {
        await cmdParar.execute(message, client);
        return;
    }
    if (bodyLower === '!voltar') {
        await cmdVoltar.execute(message, client);
        return;
    }

    // 1. SELECT MODE (Middleware logic)
    // Só processa números se estiver nesse status e NÃO for um comando (embora comandos já tenham sido tratados acima)
    if (state.status === 'SELECIONANDO_MODO') {
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